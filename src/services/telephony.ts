import type { TelephonyVendorConfig } from "./agentConfig";

export interface AsteriskConfigSnippet {
  pjsipConf: string;
  extensionsConf: string;
  notes: string[];
}

/**
 * Generates the Asterisk config that routes a vendor's SIP trunk to this
 * app's AudioSocket port. This is the entire "interface" this app has with
 * any telephony vendor - it never talks to a vendor's API directly, it just
 * produces config for your own Asterisk to use. Adding a vendor later means
 * adding one more TelephonyVendorConfig variant (agentConfig.ts) and one
 * more case here; nothing about call-handling changes.
 */
export function generateAsteriskConfig(
  vendor: TelephonyVendorConfig,
  audioSocketHost: string,
  audioSocketPort: number
): AsteriskConfigSnippet {
  switch (vendor.vendor) {
    case "plivo":
      return generatePlivoConfig(vendor, audioSocketHost, audioSocketPort);
    default: {
      const v = vendor as { vendor: string };
      throw new Error(`Unsupported telephony vendor: ${v.vendor}`);
    }
  }
}

// An arbitrary identifier Asterisk hands AudioSocket per call - it's not
// registered anywhere and doesn't need to be unique, AudioSocket just uses
// it to label the connection.
const AUDIOSOCKET_CALL_UUID = "11111111-1111-1111-1111-111111111111";

function generatePlivoConfig(
  vendor: Extract<TelephonyVendorConfig, { vendor: "plivo" }>,
  host: string,
  port: number
): AsteriskConfigSnippet {
  const trunk = vendor.sipTrunkName;

  const pjsipConf = `; --- Plivo trunk: ${trunk} ---
[${trunk}]
type=endpoint
context=from-${trunk}
disallow=all
allow=ulaw
outbound_auth=${trunk}-auth
aors=${trunk}-aor
from_user=${vendor.phoneNumber}

[${trunk}-auth]
type=auth
auth_type=userpass
username=${vendor.authId}
password=${vendor.authToken}

[${trunk}-aor]
type=aor
contact=sip:${vendor.sipDomain}

[${trunk}-identify]
type=identify
endpoint=${trunk}
match=${vendor.sipDomain}
`;

  const extensionsConf = `; --- Plivo trunk: ${trunk} ---
[from-${trunk}]
exten => ${vendor.phoneNumber},1,Answer()
 same => n,AudioSocket(${AUDIOSOCKET_CALL_UUID},${host}:${port})
 same => n,Hangup()
`;

  return {
    pjsipConf,
    extensionsConf,
    notes: [
      "This is a template built from the general PJSIP pattern and Plivo's own (sip.conf-based) Asterisk guide - " +
        "double-check it against your actual Plivo Console trunk before relying on it in production.",
      `sipDomain ("${vendor.sipDomain}") must be the exact "Termination SIP Domain" shown for this trunk in the Plivo Console - it's account-specific, not a value anyone can guess.`,
      "Append these blocks to your existing pjsip.conf and extensions.conf (don't replace the whole file), then `asterisk -rx 'module reload res_pjsip.so'` and `asterisk -rx 'dialplan reload'`.",
    ],
  };
}
