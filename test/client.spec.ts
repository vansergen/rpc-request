import { ok, fail, deepStrictEqual } from "node:assert";
import { createServer, Server, STATUS_CODES } from "node:http";
import Blob from "fetch-blob";
import { Response, Headers } from "node-fetch";
import FetchClient, { UnsuccessfulFetch } from "../index.js";

const port = 15474;
const url = "some/url";
const baseUrl = `http://localhost:${port}/api/`;
const expected = { result: "ok" } as const;

describe("FetchClient", () => {
  let server: Server;

  beforeEach((done) => {
    server = createServer((request, response) => {
      if (request.url !== "/api/some/url") {
        response.statusCode = 404;
        response.end();
        return;
      }

      switch (request.method) {
        case "GET":
        case "POST":
        case "DELETE":
        case "OPTIONS":
        case "PATCH":
          response.end(JSON.stringify(expected));
          break;
        case "HEAD":
        case "PUT":
        case "TRACE":
          response.end();
          break;
        default:
          response.statusCode = 405;
          response.end();
      }
    }).listen(port, done);
  });

  afterEach((done) => server.close(done));

  it("Uses 'raw' as the default `transform` parameter", async () => {
    const client = new FetchClient({}, { baseUrl });
    const response = await client.fetch(url);
    ok(response instanceof Response);
  });

  it("Rejects on not ok responses by default", async () => {
    const client = new FetchClient();
    try {
      await client.fetch(`${baseUrl}not-exists`);
      fail("Should throw an error");
    } catch (error) {
      ok(error instanceof UnsuccessfulFetch);
      deepStrictEqual(error.message, STATUS_CODES[404]);
      deepStrictEqual(error.name, "UnsuccessfulFetch");
      ok(error.response instanceof Response);
    }
  });

  it("Updates `fetchOptions`", () => {
    const client = new FetchClient();
    deepStrictEqual(client.fetchOptions, { headers: new Headers({}) });
    const headers = { "X-HEADER": "1" };
    client.fetchOptions = { headers };
    deepStrictEqual(client.fetchOptions, { headers: new Headers(headers) });
  });

  it("Transforms the response to `Buffer`", async () => {
    const transform = "buffer";
    const client = new FetchClient<Buffer>({}, { transform, baseUrl });
    const response = await client.fetch(url);
    ok(response instanceof Buffer);
  });

  it("Transforms the response to `ArrayBuffer`", async () => {
    const transform = "arrayBuffer";
    const client = new FetchClient<ArrayBuffer>({}, { transform, baseUrl });
    const response = await client.fetch(url);
    ok(response instanceof ArrayBuffer);
  });

  it("Transforms the response to `Blob`", async () => {
    const transform = "blob";
    const client = new FetchClient<Blob>({}, { transform, baseUrl });
    const response = await client.fetch(url);
    ok(response instanceof Blob);
  });

  it("Transforms the response to `string`", async () => {
    const transform = "text";
    const client = new FetchClient<string>({}, { transform, baseUrl });
    const response = await client.fetch(url);
    deepStrictEqual(typeof response, "string");
  });

  it("Transforms the response to `json`", async () => {
    const transform = "json";
    const client = new FetchClient<unknown>({}, { transform, baseUrl });
    const response = await client.fetch(url);
    deepStrictEqual(response, expected);
  });

  describe("HTTP Methods", () => {
    it("Makes a `GET` request", async () => {
      const transform = "json";
      const client = new FetchClient<unknown>({}, { transform, baseUrl });
      const response = await client.get(url);
      deepStrictEqual(response, expected);
    });

    it("Makes a `POST` request", async () => {
      const transform = "json";
      const client = new FetchClient<unknown>({}, { transform, baseUrl });
      const response = await client.post(url);
      deepStrictEqual(response, expected);
    });

    it("Makes a `DELETE` request", async () => {
      const transform = "json";
      const client = new FetchClient<unknown>({}, { transform, baseUrl });
      const response = await client.delete(url);
      deepStrictEqual(response, expected);
    });

    it("Makes a `OPTIONS` request", async () => {
      const transform = "json";
      const client = new FetchClient<unknown>({}, { transform, baseUrl });
      const response = await client.options(url);
      deepStrictEqual(response, expected);
    });

    it("Makes a `PATCH` request", async () => {
      const transform = "json";
      const client = new FetchClient<unknown>({}, { transform, baseUrl });
      const response = await client.patch(url);
      deepStrictEqual(response, expected);
    });

    it("Makes a `HEAD` request", async () => {
      const transform = "text";
      const client = new FetchClient<string>({}, { transform, baseUrl });
      const response = await client.head(url);
      deepStrictEqual(response, "");
    });

    it("Makes a `PUT` request", async () => {
      const transform = "text";
      const client = new FetchClient<string>({}, { transform, baseUrl });
      const response = await client.put(url);
      deepStrictEqual(response, "");
    });

    it("Makes a `TRACE` request", async () => {
      const transform = "text";
      const client = new FetchClient<string>({}, { transform, baseUrl });
      const response = await client.trace(url);
      deepStrictEqual(response, "");
    });
  });
});
