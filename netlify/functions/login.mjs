import crypto from "node:crypto";

function getSecret(name) {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

function safeEqual(a, b) {
  const aa = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}

function sign(payload, secret) {
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

export default async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: { "content-type": "application/json" }, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const usernameExpected = typeof process.env.FAMILY_USERNAME === "string" ? process.env.FAMILY_USERNAME.trim() : "";
  const passwordExpected = typeof process.env.FAMILY_PASSWORD === "string" ? process.env.FAMILY_PASSWORD : "";

  if (!usernameExpected || !passwordExpected) {
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ error: "Authentication is not configured. Check FAMILY_USERNAME and FAMILY_PASSWORD in Netlify Environment Variables, with Functions scope enabled, then redeploy." })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, headers: { "content-type": "application/json" }, body: JSON.stringify({ error: "Invalid request" }) };
  }

  const username = typeof body.username === "string" ? body.username : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!safeEqual(username, usernameExpected) || !safeEqual(password, passwordExpected)) {
    return { statusCode: 401, headers: { "content-type": "application/json" }, body: JSON.stringify({ error: "Incorrect username or password" }) };
  }

  // Long-lived session, revoked by explicit logout. A one-year max lifetime is used
  // as a browser/security backstop; the site has no 30-day forced logout.
  const payload = JSON.stringify({ sub: username, iat: Date.now(), exp: Date.now() + 365 * 24 * 60 * 60 * 1000, nonce: crypto.randomBytes(16).toString("hex") });
  const encoded = Buffer.from(payload).toString("base64url");
  const token = encoded + "." + sign(encoded, passwordExpected);

  return {
    statusCode: 200,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      "set-cookie": `family_session=${token}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Strict`
    },
    body: JSON.stringify({ ok: true })
  };
}

export { handler };
