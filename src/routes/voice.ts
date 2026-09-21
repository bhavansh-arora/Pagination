import { Router } from "express";
import twilio from "twilio";
import { config } from "../config";

export const voiceRouter = Router();

/**
 * Twilio calls this webhook when someone dials the agent's number.
 * We answer by opening a bidirectional Media Stream back to our
 * WebSocket server, so we can both listen to and talk to the caller.
 */
voiceRouter.post("/incoming-call", (_req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();
  const connect = twiml.connect();
  connect.stream({ url: `wss://${config.publicHost}/media-stream` });

  res.type("text/xml");
  res.send(twiml.toString());
});

/**
 * Places an outbound call from the agent's Twilio number to `to`,
 * which will run the same incoming-call TwiML once answered.
 */
voiceRouter.post("/call", async (req, res) => {
  const { to } = req.body ?? {};
  if (!to) {
    res.status(400).json({ error: "Missing 'to' phone number" });
    return;
  }

  const client = twilio(config.twilio.accountSid, config.twilio.authToken);
  const call = await client.calls.create({
    to,
    from: config.twilio.phoneNumber,
    url: `https://${config.publicHost}/voice/incoming-call`,
  });

  res.json({ sid: call.sid });
});
