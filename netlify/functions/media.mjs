import crypto from "node:crypto";
import { getDeployStore } from "@netlify/blobs";

function verifyToken(token, secret) {
  try {
    const [encoded, sig] = token.split(".");
    if (!encoded || !sig) return false;
    const expected = crypto.createHmac("sha256", secret).update(encoded).digest("base64url");
    const a = Buffer.from(sig), b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    return payload.exp > Date.now();
  } catch { return false; }
}

export default async function handler(event) {
  const cookie = event.headers.cookie || event.headers.Cookie || "";
  const match = cookie.match(/(?:^|;\s*)family_session=([^;]+)/);
  const secret = process.env.FAMILY_PASSWORD || "";
  if (!secret || !match || !verifyToken(decodeURIComponent(match[1]), secret)) {
    return { statusCode: 401, headers: { "content-type": "application/json", "cache-control": "no-store" }, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  const key = event.queryStringParameters?.key;
  if (!key || !/^(photo-(0[1-9]|10)\.(jpg|jpeg|png|webp)|family\.mp3)$/i.test(key)) {
    return { statusCode: 400, headers: { "content-type": "application/json" }, body: JSON.stringify({ error: "Invalid media key" }) };
  }

  const store = getDeployStore("family-private");
  const blob = await store.get(key, { type: "arrayBuffer" });
  if (!blob) return { statusCode: 404, body: "Not found" };

  const contentType = /\.mp3$/i.test(key) ? "audio/mpeg" : "image/jpeg";
  return {
    statusCode: 200,
    headers: {
      "content-type": contentType,
      "cache-control": "private, no-store"
    },
    body: Buffer.from(blob).toString("base64"),
    isBase64Encoded: true
  };
}
export { handler };
