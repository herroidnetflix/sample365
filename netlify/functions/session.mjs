import crypto from "node:crypto";

function verifyToken(token, secret) {
  try {
    const [encoded, sig] = token.split(".");
    if (!encoded || !sig) return false;
    const expected = crypto.createHmac("sha256", secret).update(encoded).digest("base64url");
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    return payload.exp > Date.now();
  } catch {
    return false;
  }
}

export default async function handler(event) {
  const cookie = event.headers.cookie || event.headers.Cookie || "";
  const match = cookie.match(/(?:^|;\s*)family_session=([^;]+)/);
  const secret = process.env.FAMILY_PASSWORD || "";
  const ok = !!secret && !!match && verifyToken(decodeURIComponent(match[1]), secret);
  return {
    statusCode: 200,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
    body: JSON.stringify({ authenticated: ok })
  };
}
export { handler };
