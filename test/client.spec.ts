import { ok, fail, deepStrictEqual } from "node:assert";
import { STATUS_CODES } from "node:http";
import FetchClient, { UnsuccessfulFetch } from "../index.js";
import { server, RESPONSE } from "./lib/server.js";
import { Response, Headers } from "node-fetch";
import Blob from "fetch-blob";

const port = 15474;
const baseUrl = `http://localhost:${port}`;

describe("FetchClient", () => {
  beforeEach((done) => server.listen(port, done));

  afterEach((done) => server.close(done));

  it("Uses 'raw' as the default `transform` parameter", async () => {
    const client = new FetchClient({}, { baseUrl });
    const response = await client.fetch();
    ok(response instanceof Response);
  });

  it("Rejects on not ok responses by default", async () => {
    const client = new FetchClient();
    try {
      await client.fetch(`${baseUrl}/not-exists`);
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
    deepStrictEqual(client.fetchOptions, {
      headers: new Headers(headers),
    });
  });

  it("Transforms the response to `Buffer`", async () => {
    const transform = "buffer";
    const client = new FetchClient<Buffer>({}, { transform, baseUrl });
    const response = await client.fetch();
    ok(response instanceof Buffer);
  });

  it("Transforms the response to `ArrayBuffer`", async () => {
    const transform = "arrayBuffer";
    const client = new FetchClient<ArrayBuffer>({}, { transform, baseUrl });
    const response = await client.fetch();
    ok(response instanceof ArrayBuffer);
  });

  it("Transforms the response to `Blob`", async () => {
    const transform = "blob";
    const client = new FetchClient<Blob>({}, { transform, baseUrl });
    const response = await client.fetch();
    ok(response instanceof Blob);
  });

  it("Transforms the response to `string`", async () => {
    const transform = "text";
    const client = new FetchClient<string>({}, { transform, baseUrl });
    const response = await client.fetch();
    deepStrictEqual(typeof response, "string");
  });

  it("Transforms the response to `json`", async () => {
    const transform = "json";
    const client = new FetchClient<unknown>({}, { transform, baseUrl });
    const response = await client.fetch();
    deepStrictEqual(response, RESPONSE);
  });

  describe("HTTP Methods", () => {
    it("Makes a `GET` request", async () => {
      const transform = "json";
      const client = new FetchClient<unknown>({}, { transform, baseUrl });
      const response = await client.get();
      deepStrictEqual(response, RESPONSE);
    });

    it("Makes a `POST` request", async () => {
      const transform = "json";
      const client = new FetchClient<unknown>({}, { transform, baseUrl });
      const response = await client.post();
      deepStrictEqual(response, RESPONSE);
    });

    it("Makes a `DELETE` request", async () => {
      const transform = "json";
      const client = new FetchClient<unknown>({}, { transform, baseUrl });
      const response = await client.delete();
      deepStrictEqual(response, RESPONSE);
    });

    it("Makes a `OPTIONS` request", async () => {
      const transform = "json";
      const client = new FetchClient<unknown>({}, { transform, baseUrl });
      const response = await client.options();
      deepStrictEqual(response, RESPONSE);
    });

    it("Makes a `PATCH` request", async () => {
      const transform = "json";
      const client = new FetchClient<unknown>({}, { transform, baseUrl });
      const response = await client.patch();
      deepStrictEqual(response, RESPONSE);
    });

    it("Makes a `HEAD` request", async () => {
      const transform = "text";
      const client = new FetchClient<string>({}, { transform, baseUrl });
      const response = await client.head();
      deepStrictEqual(response, "");
    });

    it("Makes a `PUT` request", async () => {
      const transform = "text";
      const client = new FetchClient<string>({}, { transform, baseUrl });
      const response = await client.put();
      deepStrictEqual(response, "");
    });

    it("Makes a `TRACE` request", async () => {
      const transform = "text";
      const client = new FetchClient<string>({}, { transform, baseUrl });
      const response = await client.trace();
      deepStrictEqual(response, "");
    });
  });
});
