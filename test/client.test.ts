import { ok, fail, deepStrictEqual } from "node:assert";
import { Blob } from "node:buffer";
import { STATUS_CODES } from "node:http";
import { Response, MockAgent, setGlobalDispatcher } from "undici";
import Fetch, { UnsuccessfulFetch } from "../index.js";

describe("Fetch", () => {
  const port = 4321;
  const prefix = "/api/";
  const base_url = new URL(`http://www.example.com:${port}${prefix}`);

  const mockAgent = new MockAgent();
  mockAgent.disableNetConnect();
  setGlobalDispatcher(mockAgent);
  const mockPool = mockAgent.get(base_url.origin);

  it("Uses the default options", () => {
    const fetch = new Fetch();
    deepStrictEqual(fetch.reject, true);
    deepStrictEqual(fetch.base_url, null);
    deepStrictEqual(fetch.transform, null);
    deepStrictEqual(fetch.init, {});
  });

  it("Rejects when no `base_url` is provided", async () => {
    const client = new Fetch();
    const path = "/v2/bank-transfer";

    try {
      await client.fetch(path);
      fail("Should throw an error");
    } catch (error) {
      ok(error instanceof TypeError);
      deepStrictEqual(error.message, "Invalid URL");
    }
  });

  it("Returns raw response on not ok responses (transform === null)", async () => {
    const client = new Fetch({ base_url });
    const path = "v2/bank-transfer";
    const method = "POST";
    const headers = { "x-token-secret": "SuperSecretToken" };
    const body = JSON.stringify({ recepient: "1234567890", amount: "100" });
    const status = 404;
    const expected = { message: "v2 is not supported" };

    mockPool
      .intercept({ path: `${prefix}${path}`, method, headers, body })
      .reply(status, expected);

    deepStrictEqual(client.base_url, base_url);
    const response = await client.fetch<Response>(path, {
      method,
      headers,
      body,
    });
    ok(response instanceof Response);
    deepStrictEqual(response.bodyUsed, false);
    deepStrictEqual(response.status, 404);
    const actual = await response.json();
    deepStrictEqual(response.bodyUsed, true);
    deepStrictEqual(actual, expected);
  });

  it("Rejects not ok responses by default", async () => {
    const client = new Fetch({ base_url, transform: "json" });
    const path = "v2/bank-transfer";
    const method = "POST";
    const headers = { "x-token-secret": "SuperSecretToken" };
    const body = JSON.stringify({ recepient: "1234567890", amount: "100" });

    const status = 404;
    const expected = { message: "v2 is not supported" };

    mockPool
      .intercept({ path: `${prefix}${path}`, method, headers, body })
      .reply(status, expected);

    try {
      deepStrictEqual(client.base_url, base_url);
      await client.fetch<never>(path, { method, headers, body });
      fail("Should throw an error");
    } catch (error) {
      ok(error instanceof UnsuccessfulFetch);
      deepStrictEqual(error.message, STATUS_CODES[status]);
      deepStrictEqual(error.name, "UnsuccessfulFetch");
      ok(error.response instanceof Response);
      deepStrictEqual(error.response.bodyUsed, true);
      deepStrictEqual(error.data, expected);
    }
  });

  it("Transforms the response to `ArrayBuffer`", async () => {
    const transform = "arrayBuffer";
    const headers = { "x-token-secret": "SuperSecretToken" };
    const client = new Fetch({ base_url, transform, headers });
    const path = "v2/ok";
    const status = 200;
    const expected = { message: "ok" };

    mockPool
      .intercept({ path: `${prefix}${path}`, method: "GET", headers })
      .reply(status, expected);

    deepStrictEqual(client.base_url, base_url);
    const response = await client.fetch<ArrayBuffer>(path);
    ok(response instanceof ArrayBuffer);

    const text = new TextDecoder().decode(response);
    deepStrictEqual(JSON.parse(text), expected);
  });

  it("Transforms the response to `Buffer`", async () => {
    const transform = "buffer";
    const headers = { "x-token-secret": "SuperSecretToken" };
    const client = new Fetch({ base_url, transform, headers });
    const path = "v2/ok";
    const status = 200;
    const expected = { message: "ok" };

    mockPool
      .intercept({ path: `${prefix}${path}`, method: "GET", headers })
      .reply(status, expected);

    deepStrictEqual(client.base_url, base_url);
    const response = await client.fetch<Buffer>(path);
    ok(response instanceof Buffer);

    const text = new TextDecoder().decode(response);
    deepStrictEqual(JSON.parse(text), expected);
  });

  it("Transforms the response to `Blob`", async () => {
    const transform = "blob";
    const method = "PATCH";
    const headers = { "x-token-secret": "SuperSecretToken" };
    const client = new Fetch({ base_url, transform, headers, method });
    const path = "v2/ok";
    const status = 200;
    const expected = { message: "ok" };

    mockPool
      .intercept({ path: `${prefix}${path}`, method, headers })
      .reply(status, expected);
    deepStrictEqual(client.base_url, base_url);

    const response = await client.fetch<Blob>(path);
    ok(response instanceof Blob);

    const text = await response.text();
    deepStrictEqual(JSON.parse(text), expected);
  });

  it("Transforms the response to `string`", async () => {
    const transform = "text";
    const headers = { "x-token-secret": "SuperSecretToken" };
    const client = new Fetch({ base_url, transform, headers });
    const path = "v2/ok";
    const status = 200;
    const expected = { message: "ok" };

    mockPool
      .intercept({ path: `${prefix}${path}`, method: "GET", headers })
      .reply(status, expected);

    deepStrictEqual(client.base_url, base_url);

    const response = await client.fetch<string>(path);
    ok(typeof response === "string");
    deepStrictEqual(JSON.parse(response), expected);
  });

  it("Transforms the response to `json`", async () => {
    const transform = "json";
    const method = "POST";
    const headers = { "x-token-secret": "SuperSecretToken" };
    const client = new Fetch({ base_url, transform, headers, method });
    const path = "v2/ok";
    const status = 200;
    const expected = { message: "ok" };

    mockPool
      .intercept({ path: `${prefix}${path}`, method, headers })
      .reply(status, expected);

    const response = await client.fetch<{ message: string }>(path);
    deepStrictEqual(response, expected);
  });

  describe("HTTP Methods", () => {
    const methods = [
      "get",
      "post",
      "delete",
      "options",
      "patch",
      "head",
      "put",
    ] as const;

    for (const method of methods) {
      it(`Makes a ${method.toUpperCase()} request with the .${method}() method`, async () => {
        const transform = "json";
        const headers = { "x-token-secret": "SuperSecretToken" };
        const client = new Fetch({ base_url, transform, headers });
        const path = "v2/ok";
        const status = 200;
        const expected = { message: "ok" };
        mockPool
          .intercept({ path: `${prefix}${path}`, method, headers })
          .reply(status, expected);

        deepStrictEqual(client.base_url, base_url);

        if (method === "head") {
          const response = await client.head(path);
          ok(response instanceof Response);
          deepStrictEqual(response.status, status);
          deepStrictEqual(response.bodyUsed, false);
        } else {
          const response = await client[method]<typeof expected>(path);
          deepStrictEqual(response, expected);
        }
      });
    }
  });
});
