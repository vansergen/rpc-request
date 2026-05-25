/* eslint-disable @typescript-eslint/no-floating-promises */
import { deepStrictEqual, fail, ok } from "node:assert";
import { STATUS_CODES } from "node:http";
import { afterEach, describe, mock, test } from "node:test";
import Fetch, { UnsuccessfulFetch } from "../index.js";

interface IMockExpected {
  url?: URL | string;
  method?: string;
  headers?:
    | ((h: Record<string, string | undefined>) => boolean)
    | Record<string, string>;
  body?: string;
}

interface IMockReply {
  status?: number;
  headers?: Record<string, string>;
  body?: BodyInit | null;
}

/**
 * Replace `globalThis.fetch` for the next single call. Validates the
 * request against `expected` and resolves with a synthetic `Response`
 * built from `reply`.
 */
function mockFetch(expected: IMockExpected, reply: IMockReply = {}): void {
  mock.method(
    globalThis,
    "fetch",
    (
      input: Request | URL | string,
      requestInit: RequestInit = {},
    ): Promise<Response> => {
      const inputUrl =
        input instanceof URL
          ? input.href
          : typeof input === "string"
            ? input
            : input.url;

      if (typeof expected.url !== "undefined") {
        deepStrictEqual(inputUrl, expected.url.toString());
      }
      if (typeof expected.method !== "undefined") {
        // Native `fetch` treats a missing `method` as GET.
        const actualMethod = (requestInit.method ?? "GET").toUpperCase();
        deepStrictEqual(actualMethod, expected.method.toUpperCase());
      }
      if (typeof expected.headers !== "undefined") {
        const actual = new Headers(requestInit.headers);
        const actualObj: Record<string, string | undefined> = {};
        actual.forEach((value, key) => {
          actualObj[key] = value;
        });
        if (typeof expected.headers === "function") {
          ok(expected.headers(actualObj));
        } else {
          for (const [key, value] of Object.entries(expected.headers)) {
            deepStrictEqual(actualObj[key.toLowerCase()], value);
          }
        }
      }
      if (typeof expected.body !== "undefined") {
        deepStrictEqual(requestInit.body, expected.body);
      }
      const status = reply.status ?? 200;
      return Promise.resolve(
        new Response(reply.body ?? null, {
          status,
          statusText: STATUS_CODES[status] ?? "",
          ...(reply.headers ? { headers: reply.headers } : {}),
        }),
      );
    },
    { times: 1 },
  );
}

describe("Fetch", () => {
  const port = 4321;
  const prefix = "/api/";
  const base_url = new URL(`http://www.example.com:${port}${prefix}`);

  afterEach(() => {
    mock.restoreAll();
  });

  test("Uses the default options", () => {
    const fetch = new Fetch();
    deepStrictEqual(fetch.reject, true);
    deepStrictEqual(fetch.base_url, null);
    deepStrictEqual(fetch.transform, null);
    deepStrictEqual(fetch.init, {});
  });

  test("Rejects when no `base_url` is provided", async () => {
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

  test("Returns raw response on not ok responses (transform === null)", async () => {
    const client = new Fetch({ base_url });
    const path = "v2/bank-transfer";
    const method = "POST";
    const headers = { "x-token-secret": "SuperSecretToken" };
    const body = JSON.stringify({ recepient: "1234567890", amount: "100" });
    const status = 404;
    const expected = { message: "v2 is not supported" };

    mockFetch(
      {
        url: new URL(path, base_url),
        method,
        headers,
        body,
      },
      {
        status,
        body: JSON.stringify(expected),
        headers: { "Content-Type": "application/json" },
      },
    );

    deepStrictEqual(client.base_url, base_url);
    const response = await client.fetch<Response>(path, {
      method,
      headers,
      body,
    });
    ok(response instanceof Response);
    deepStrictEqual(response.bodyUsed, false);
    deepStrictEqual(response.status, 404);
    const actual = (await response.json()) as Promise<unknown>;
    deepStrictEqual(response.bodyUsed, true);
    deepStrictEqual(actual, expected);
  });

  test("Rejects not ok responses by default", async () => {
    const client = new Fetch({ base_url, transform: "json" });
    const path = "v2/bank-transfer";
    const method = "POST";
    const headers = { "x-token-secret": "SuperSecretToken" };
    const body = JSON.stringify({ recepient: "1234567890", amount: "100" });
    const status = 404;
    const expected = { message: "v2 is not supported" };

    mockFetch(
      { url: new URL(path, base_url), method, headers, body },
      {
        status,
        body: JSON.stringify(expected),
        headers: { "Content-Type": "application/json" },
      },
    );

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

  test("Rewrites the default options", async () => {
    const client = new Fetch({
      base_url,
      transform: "text",
      reject: true,
    });

    const url = "https://example2.com";
    const path = "v2/ok";
    const status = 404;
    const expected = { message: "not_ok" };

    mockFetch(
      { url: new URL(path, url), method: "GET" },
      {
        status,
        body: JSON.stringify(expected),
        headers: { "Content-Type": "application/json" },
      },
    );

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

  test("Transforms the response to `ArrayBuffer`", async () => {
    const transform = "arrayBuffer";
    const headers = { "x-token-secret": "SuperSecretToken" };
    const client = new Fetch({ base_url, transform, headers });
    const path = "v2/ok";
    const expected = { message: "ok" };

    mockFetch(
      { url: new URL(path, base_url), method: "GET", headers },
      { body: JSON.stringify(expected) },
    );

    deepStrictEqual(client.base_url, base_url);
    const response = await client.fetch<ArrayBuffer>(path);
    ok(response instanceof ArrayBuffer);

    const text = new TextDecoder().decode(response);
    deepStrictEqual(JSON.parse(text), expected);
  });

  test("Transforms the response to `Buffer`", async () => {
    const transform = "buffer";
    const headers = { "x-token-secret": "SuperSecretToken" };
    const client = new Fetch({ base_url, transform, headers });
    const path = "v2/ok";
    const expected = { message: "ok" };

    mockFetch(
      { url: new URL(path, base_url), method: "GET", headers },
      { body: JSON.stringify(expected) },
    );

    deepStrictEqual(client.base_url, base_url);
    const response = await client.fetch<Buffer>(path);
    ok(response instanceof Buffer);

    const text = new TextDecoder().decode(response);
    deepStrictEqual(JSON.parse(text), expected);
  });

  test("Transforms the response to `Blob`", async () => {
    const transform = "blob";
    const method = "PATCH";
    const headers = { "x-token-secret": "SuperSecretToken" };
    const client = new Fetch({ base_url, transform, headers, method });
    const path = "v2/ok";
    const expected = { message: "ok" };

    mockFetch(
      { url: new URL(path, base_url), method, headers },
      { body: JSON.stringify(expected) },
    );

    deepStrictEqual(client.base_url, base_url);
    const response = await client.fetch<Blob>(path);
    ok(response instanceof Blob);

    const text = await response.text();
    deepStrictEqual(JSON.parse(text), expected);
  });

  test("Transforms the response to `formData`", async () => {
    const transform = "formData";
    const method = "GET";
    const headers = { "x-token-secret": "SuperSecretToken" };
    const client = new Fetch({ base_url, transform, headers, method });
    const path = "v2/ok";
    const form = new FormData();
    form.append("description", "Some text here");
    const file_content = ["str1\n", "str2\n"];
    const file = new Blob(file_content, { type: "text/plain" });
    form.append("file", file);
    const tempResponse = new Response(form);
    const ct = tempResponse.headers.get("Content-Type");
    const [, boundary] = ct?.split("boundary=") ?? [];
    if (!boundary) {
      throw new Error("Content-Type is missing from the response");
    }
    const body = await tempResponse.text();

    mockFetch(
      { url: new URL(path, base_url), method, headers },
      {
        body,
        headers: {
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
        },
      },
    );

    const response = await client.fetch<FormData>(path);
    ok(response instanceof FormData);
    // Inspect the PARSED response, not the original `form` we used to
    // build the wire payload — that's what proves the transform actually
    // round-tripped through the body.
    deepStrictEqual(response.get("description"), "Some text here");
    const actual_file = response.get("file");
    ok(actual_file instanceof Blob);
    deepStrictEqual(await actual_file.text(), file_content.join(""));
  });

  test("Transforms the response to `string`", async () => {
    const transform = "text";
    const headers = { "x-token-secret": "SuperSecretToken" };
    const client = new Fetch({ base_url, transform, headers });
    const path = "v2/ok";
    const expected = { message: "ok" };

    mockFetch(
      { url: new URL(path, base_url), method: "GET", headers },
      { body: JSON.stringify(expected) },
    );

    deepStrictEqual(client.base_url, base_url);

    const response = await client.fetch<string>(path);
    ok(typeof response === "string");
    deepStrictEqual(JSON.parse(response), expected);
  });

  test("Transforms the response to `json`", async () => {
    const transform = "json";
    const method = "POST";
    const headers = { "x-token-secret": "SuperSecretToken" };
    const client = new Fetch({ base_url, transform, headers, method });
    const path = "v2/ok";
    const expected = { message: "ok" };

    mockFetch(
      { url: new URL(path, base_url), method, headers },
      {
        body: JSON.stringify(expected),
        headers: { "Content-Type": "application/json" },
      },
    );

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
      test(`Makes a ${method.toUpperCase()} request with the .${method}() method`, async () => {
        const transform = "json";
        const headers = { "x-token-secret": "SuperSecretToken" };
        const client = new Fetch({ base_url, transform, headers });
        const path = "v2/ok";
        const status = 200;
        const expected = { message: "ok" };
        const responseBody =
          method === "head" ? null : JSON.stringify(expected);
        mockFetch(
          {
            url: new URL(path, base_url),
            method: method.toUpperCase(),
            headers,
          },
          {
            status,
            body: responseBody,
            headers: { "Content-Type": "application/json" },
          },
        );

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
