export const config = { api: { bodyParser: false } };

const BACKEND = (
  process.env.BACKEND_URL || "https://sasta-bazaar-six.vercel.app"
).replace(/\/$/, "");

export default async function handler(req, res) {
  try {
    const incoming = new URL(req.url, "http://localhost");
    let path = incoming.searchParams.get("path") || "";
    incoming.searchParams.delete("path");

    // All your Django routes end with a slash
    if (path && !path.endsWith("/")) path += "/";

    const qs = incoming.searchParams.toString();
    const target = `${BACKEND}/api/${path}${qs ? "?" + qs : ""}`;

    const headers = { ...req.headers };
    for (const h of [
      "host", "connection", "content-length", "accept-encoding",
      "x-forwarded-host", "x-forwarded-for", "x-forwarded-proto",
      "x-vercel-id", "x-vercel-deployment-url", "x-vercel-forwarded-for",
      "x-real-ip",
    ]) delete headers[h];

    let body;
    if (!["GET", "HEAD"].includes(req.method)) {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      body = Buffer.concat(chunks);
    }

    const response = await fetch(target, {
      method: req.method,
      headers,
      body,
      redirect: "manual",
    });

    res.status(response.status);

    const skip = ["content-encoding", "transfer-encoding", "content-length", "set-cookie", "connection"];
    response.headers.forEach((value, key) => {
      if (skip.includes(key)) return;
      if (key === "location") {
        res.setHeader(key, value.replace(BACKEND, ""));
        return;
      }
      res.setHeader(key, value);
    });

    const cookies = response.headers.getSetCookie();
    if (cookies.length) res.setHeader("Set-Cookie", cookies);

    res.send(Buffer.from(await response.arrayBuffer()));
  } catch (err) {
    console.error("API proxy error:", err);
    res.status(502).json({ error: "Bad gateway", detail: String(err) });
  }
}