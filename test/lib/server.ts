import http from "http";

export const RESPONSE = { result: "ok" } as const;

export const server = http.createServer((request, response) => {
  const { url, method } = request;

  if (url !== "/") {
    response.statusCode = 404;
    return setImmediate(() => {
      response.end();
    });
  }

  switch (method) {
    case "GET":
    case "POST":
    case "DELETE":
    case "OPTIONS":
    case "PATCH":
      response.statusCode = 200;
      return setImmediate(() => {
        response.end(JSON.stringify(RESPONSE));
      });
    case "HEAD":
    case "PUT":
    case "TRACE":
      response.statusCode = 200;
      return setImmediate(() => {
        response.end();
      });
    default:
      response.statusCode = 405;
      return setImmediate(() => {
        response.end();
      });
  }
});
