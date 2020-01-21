import * as http from "http";

export const server = http.createServer((request, response) => {
  const { url, method } = request;
  if (!url || !method) {
    throw new Error("`url` or `method` is missing");
  } else if (url.substring(1) === method.toLowerCase()) {
    response.statusCode = 200;
  } else {
    return (response.statusCode = 404) && response.end();
  }
  if (method === "HEAD") {
    return response.end();
  }
  setTimeout(() => response.end(JSON.stringify({ result: "ok" })), 1);
});
