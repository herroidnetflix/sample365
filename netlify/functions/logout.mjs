export default async function handler() {
  return {
    statusCode: 200,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      "set-cookie": "family_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict"
    },
    body: JSON.stringify({ ok: true })
  };
}
export { handler };
