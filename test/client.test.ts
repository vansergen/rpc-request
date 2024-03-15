import { ok, fail, deepStrictEqual } from "node:assert";
import { Blob } from "node:buffer";
import { STATUS_CODES } from "node:http";
import { Response, FormData, MockAgent, setGlobalDispatcher } from "undici";
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
      ok("stack" in error);
      ok(error.response instanceof Response);
      deepStrictEqual(error.response.bodyUsed, true);
      deepStrictEqual(error.data, expected);
    }
  });

  it("Rewrites the default options", async () => {
    const client = new Fetch({
      base_url,
      transform: "text",
      reject: true,
    });

    const url = "https://example2.com";
    const path = "v2/ok";
    const status = 404;
    const expected = { message: "not_ok" };

    mockAgent
      .get(new URL(path, url).origin)
      .intercept({ path: new URL(path, url).toString(), method: "GET" })
      .reply(status, expected);

    deepStrictEqual(client.base_url, base_url);
    deepStrictEqual(client.transform, "text");
    deepStrictEqual(client.reject, true);
    const transform = "json";
    const reject = !client.reject;

    const response = await client.fetch<Response>(path, {
      base_url: url,
      transform,
      reject,
    });
    deepStrictEqual(response, expected);
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

  it("Transforms the response to `formData`", async () => {
    const transform = "formData";
    const method = "GET";
    const headers = { "x-token-secret": "SuperSecretToken" };
    const client = new Fetch({ base_url, transform, headers, method });
    const path = "v2/ok";
    const status = 200;
    const form = new FormData();
    form.append("description", "Some text here");
    const file_content = ["str1\n", "str2\n"];
    const file = new Blob(file_content, {
      type: "text/plain",
      endings: "native",
    });
    form.append("file", file);
    const temp = new Response(form);
    const ct = temp.headers.get("Content-Type");
    const [, boundary] = ct?.split("boundary=") ?? [];
    if (!boundary) {
      throw new Error("Content-Type is missing from the response");
    }
    const expected = await temp.text();

    mockPool
      .intercept({ path: `${prefix}${path}`, method, headers })
      .reply(status, expected, {
        headers: {
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
        },
      });

    const response = await client.fetch<FormData>(path);
    ok(response instanceof FormData);
    deepStrictEqual(form.get("description"), "Some text here");
    const actual_file = form.get("file");
    ok(actual_file instanceof Blob);
    deepStrictEqual(await actual_file.text(), file_content.join(""));
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
