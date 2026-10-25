// Fake Anthropic Messages API: streaming chat replies, structured-output drafts, and memory notes.
const http = require("http");

const requests = [];

const DRAFT = {
  tagline: "Helping burnt-out founders recover without quitting",
  bio: "I'm a former founder who burnt out at 32 and rebuilt my life around sustainable work. Now I help founders keep their company and their health.",
  philosophy: "- Rest is a strategy, not a reward.\n- The Recharge Method: Notice → Name → Protect.",
  instructions: "- Ask one question before giving advice.\n- End with one small action step.",
  boundaries: "Refer medical questions to a doctor.",
  welcomeMessage: "Hey, I'm Lena's AI. What's draining you most this week?",
  starters: ["I'm exhausted all the time", "Walk me through the Recharge Method", "How do I say no to investors?", "Help me plan a calmer week"],
  tones: ["warm", "direct"],
  responseLength: "concise",
  ctaLabel: "Book a call",
  ctaUrl: "https://calendly.com/lena",
  knowledgeNote: "## The Recharge Method\n1. Notice the signal.\n2. Name what's draining you.\n3. Protect one hour a day.",
};

const usage = { input_tokens: 1200, output_tokens: 300, cache_read_input_tokens: 48000, cache_creation_input_tokens: 0 };

function message(model, text, extra = {}) {
  return { id: "msg_" + Date.now(), type: "message", role: "assistant", model, content: [{ type: "text", text }], stop_reason: "end_turn", stop_sequence: null, usage, ...extra };
}

function start(port = 4010) {
  const server = http.createServer((req, res) => {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      const url = new URL(req.url, "http://x");
      if (url.pathname === "/mock/requests") {
        res.writeHead(200, { "content-type": "application/json" });
        return res.end(JSON.stringify(requests.slice(-20)));
      }
      const body = raw ? JSON.parse(raw) : {};
      requests.push({ path: url.pathname, model: body.model, stream: !!body.stream, system: body.system, beta: req.headers["anthropic-beta"], format: !!body.output_config?.format });

      if (body.stream) {
        res.writeHead(200, { "content-type": "text/event-stream" });
        const send = (e, d) => res.write(`event: ${e}\ndata: ${JSON.stringify(d)}\n\n`);
        send("message_start", { type: "message_start", message: { ...message(body.model, ""), content: [], stop_reason: null, usage: { ...usage, output_tokens: 0 } } });
        send("content_block_start", { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } });
        const parts = ["Let's use the **Recharge Method**.\n\n", "1. Notice\n2. Name\n3. Protect\n\n", "What's one hour you can protect today?"];
        let i = 0;
        const t = setInterval(() => {
          if (i < parts.length) return send("content_block_delta", { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: parts[i++] } });
          clearInterval(t);
          send("content_block_stop", { type: "content_block_stop", index: 0 });
          send("message_delta", { type: "message_delta", delta: { stop_reason: "end_turn", stop_sequence: null }, usage: { output_tokens: 300 } });
          send("message_stop", { type: "message_stop" });
          res.end();
        }, 60);
        return;
      }
      res.writeHead(200, { "content-type": "application/json" });
      if (body.output_config?.format) return res.end(JSON.stringify(message(body.model, JSON.stringify(DRAFT))));
      return res.end(JSON.stringify(message(body.model, "- Name: Sam\n- Goal: recover from burnout\n- Committed to protecting one hour a day")));
    });
  });
  return new Promise((r) => server.listen(port, () => r(server)));
}

module.exports = { start, requests, DRAFT };
if (require.main === module) start().then(() => console.log("anthropic mock on 4010"));
