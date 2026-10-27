const BACKEND = "https://sasta-bazaar-six.vercel.app";

export default async function handler(req, res) {
  const headers = { ...req.headers };
  delete headers.host;
  delete headers.connection;
  delete headers["content-length"];

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
  const skip = ["content-encoding", "transfer-encoding", "content-length", "set-cookie"];
  response.headers.forEach((value, key) => {
    if (!skip.includes(key)) res.setHeader(key, value);
  });
  const cookies = response.headers.getSetCookie();
  if (cookies.length) res.setHeader("Set-Cookie", cookies);

  res.send(Buffer.from(await response.arrayBuffer()));
}