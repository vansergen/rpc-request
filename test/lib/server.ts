import * as http from "http";
import * as assert from "assert";

export const server = http.createServer((request, response) => {
  const { url, method } = request;
  if (!url || !method) {
    throw new Error("`url` or `method` is missing");
  }
  assert.deepStrictEqual(url.substring(1), method.toLowerCase());
  response.statusCode = 200;
  if (method === "HEAD") {
    return response.end();
  }
  setTimeout(() => response.end(JSON.stringify({ result: "ok" })), 1);
});
