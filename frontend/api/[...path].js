// Disable Vercel's automatic body parsing so POST/PUT bodies are forwarded intact.
export const config = {
  api: { bodyParser: false },
};

const BACKEND = (
  process.env.BACKEND_URL || "https://sasta-bazaar-six.vercel.app"
).replace(/\/$/, "");

export default async function handler(req, res) {
  try {
    const headers = { ...req.headers };
    delete headers.host;
    delete headers.connection;
    delete headers["content-length"];
    delete headers["accept-encoding"]; // ask the backend for an uncompressed response

    let body;
    if (!["GET", "HEAD"].includes(req.method)) {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      body = Buffer.concat(chunks);
    }

    const response = await fetch(BACKEND + req.url, {
      method: req.method,
      headers,
      body,
      redirect: "manual",
    });

    res.status(response.status);

    const skip = [
      "content-encoding",
      "transfer-encoding",
      "content-length",
      "set-cookie",
      "connection",
    ];

    response.headers.forEach((value, key) => {
      if (skip.includes(key)) return;

      // Keep redirects (e.g. Django's APPEND_SLASH) on the frontend domain.
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