// Minimal SMTP sink that keeps received emails in memory.
const net = require("net");

const mails = [];

function decodeBody(raw) {
  // Undo quoted-printable soft breaks and escapes so links can be found.
  return raw.replace(/=\r?\n/g, "").replace(/=([0-9A-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

function subjectOf(raw) {
  const headers = raw.split(/\r?\n\r?\n/)[0].replace(/\r?\n[ \t]+/g, " ");
  const line = (headers.match(/^Subject: (.*)$/im) || [])[1] || "";
  return line
    .replace(/\?=\s+=\?/g, "?==?")
    .replace(/=\?utf-8\?([QB])\?(.*?)\?=/gi, (_, enc, text) =>
      enc.toUpperCase() === "B"
        ? Buffer.from(text, "base64").toString("utf8")
        : Buffer.from(text.replace(/_/g, " ").replace(/=([0-9A-F]{2})/gi, (__, h) => String.fromCharCode(parseInt(h, 16))), "latin1").toString("utf8"),
    );
}

function start(port = 2525) {
  const server = net.createServer((sock) => {
    let mode = "cmd";
    let buf = "";
    let mail = { to: [], data: "" };
    sock.write("220 mock-smtp\r\n");
    sock.on("data", (chunk) => {
      buf += chunk.toString("utf8");
      while (true) {
        if (mode === "data") {
          const end = buf.indexOf("\r\n.\r\n");
          if (end === -1) return;
          const raw = buf.slice(0, end);
          mail.subject = subjectOf(raw);
          mail.data = decodeBody(raw);
          mails.push(mail);
          mail = { to: [], data: "" };
          buf = buf.slice(end + 5);
          mode = "cmd";
          sock.write("250 OK\r\n");
          continue;
        }
        const nl = buf.indexOf("\r\n");
        if (nl === -1) return;
        const line = buf.slice(0, nl);
        buf = buf.slice(nl + 2);
        const cmd = line.slice(0, 4).toUpperCase();
        if (cmd === "EHLO" || cmd === "HELO") sock.write("250-mock\r\n250 OK\r\n");
        else if (cmd === "RCPT") {
          mail.to.push((line.match(/<(.*)>/) || [])[1]);
          sock.write("250 OK\r\n");
        } else if (cmd === "DATA") {
          mode = "data";
          sock.write("354 End with .\r\n");
        } else if (cmd === "QUIT") {
          sock.write("221 Bye\r\n");
          sock.end();
        } else sock.write("250 OK\r\n");
      }
    });
    sock.on("error", () => {});
  });
  return new Promise((r) => server.listen(port, () => r(server)));
}

module.exports = { start, mails };
