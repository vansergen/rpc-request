import * as assert from "assert";
import { RPC } from "../index";
import { server } from "./lib/server";

const result = "ok";
const port = 15486;
const baseUrl = "http://localhost:" + port;
const options = { json: true, baseUrl };

suite("RPC", () => {
  suiteSetup(done => server.listen(port, done));

  test("constructor", () => {
    const client = new RPC(options);
    assert.deepStrictEqual(client._rpoptions, options);
  });

  test("constructor (with no arguments)", () => {
    const client = new RPC();
    assert.deepStrictEqual(client._rpoptions, {});
  });

  test(".get()", async () => {
    const client = new RPC(options);
    const request = await client.get({ url: "get" });
    assert.deepStrictEqual(request, { result });
  });

  test(".get() (with no arguments)", async () => {
    const client = new RPC({ url: "get", ...options });
    const request = await client.get();
    assert.deepStrictEqual(request, { result });
  });

  test(".post()", async () => {
    const client = new RPC(options);
    const request = await client.post({ url: "post" });
    assert.deepStrictEqual(request, { result });
  });

  test(".post() (with no arguments)", async () => {
    const client = new RPC({ url: "post", ...options });
    const request = await client.post();
    assert.deepStrictEqual(request, { result });
  });

  test(".put()", async () => {
    const client = new RPC(options);
    const request = await client.put({ url: "put" });
    assert.deepStrictEqual(request, { result });
  });

  test(".put() (with no arguments)", async () => {
    const client = new RPC({ url: "put", ...options });
    const request = await client.put();
    assert.deepStrictEqual(request, { result });
  });

  test(".patch()", async () => {
    const client = new RPC(options);
    const request = await client.patch({ url: "patch" });
    assert.deepStrictEqual(request, { result });
  });

  test(".patch() (with no arguments)", async () => {
    const client = new RPC({ url: "patch", ...options });
    const request = await client.patch();
    assert.deepStrictEqual(request, { result });
  });

  test(".delete()", async () => {
    const client = new RPC(options);
    const request = await client.delete({ url: "delete" });
    assert.deepStrictEqual(request, { result });
  });

  test(".delete() (with no arguments)", async () => {
    const client = new RPC({ url: "delete", ...options });
    const request = await client.delete();
    assert.deepStrictEqual(request, { result });
  });

  test(".head()", async () => {
    const client = new RPC(options);
    const { connection, date } = await client.head({ url: "head" });
    assert.ok(Date.now() - new Date(date).getDate() > 0);
    assert.deepStrictEqual(connection, "close");
  });

  test(".head() (with no arguments)", async () => {
    const client = new RPC({ url: "head", ...options });
    const { connection, date } = await client.head();
    assert.ok(Date.now() - new Date(date).getDate() > 0);
    assert.deepStrictEqual(connection, "close");
  });

  test(".options()", async () => {
    const client = new RPC(options);
    const request = await client.options({ url: "options" });
    assert.deepStrictEqual(request, { result });
  });

  test(".options() (with no arguments)", async () => {
    const client = new RPC({ url: "options", ...options });
    const request = await client.options();
    assert.deepStrictEqual(request, { result });
  });

  test(".request()", async () => {
    const client = new RPC(options);
    const request = await client.request({ url: "get" });
    assert.deepStrictEqual(request, { result });
  });

  test(".request() (with no arguments)", async () => {
    const client = new RPC({ url: "get", ...options });
    const request = await client.request();
    assert.deepStrictEqual(request, { result });
  });

  test(".request() (rejected promise)", done => {
    const client = new RPC({ url: "get", ...options });
    client
      .request({ method: "POST" })
      .then(() => assert.fail("Should reject the promise"))
      .catch(error => {
        assert.deepStrictEqual(error.message, "404 - undefined");
        done();
      });
  });

  suite("Static methods", () => {
    test(".cookie()", () => {
      const _key = "SameSite";
      const _value = "Strict";
      const cookie = RPC.cookie(_key, _value);
      if (cookie === undefined) {
        throw new Error("Cookie is undefied");
      }
      const { key, value, creation } = cookie.toJSON();
      assert.deepStrictEqual(key, _key);
      assert.deepStrictEqual(value, _value);
      assert.ok(creation);
    });

    test(".jar()", () => {
      const _jar = RPC.jar();
      const _key = "SameSite";
      const _value = "Strict";
      const _cookie = RPC.cookie(_key, _value);
      if (!_cookie) {
        throw new Error("Cookie is undefied");
      }
      _jar.setCookie(_cookie, baseUrl);
      const [cookie] = _jar.getCookies(baseUrl);
      const { key, value, creation } = cookie.toJSON();
      assert.deepStrictEqual(key, _key);
      assert.deepStrictEqual(value, _value);
      assert.ok(creation);
    });

    test(".defaults()", async () => {
      const d = RPC.defaults(options);
      const request = await d("/get");
      assert.deepStrictEqual(request, { result });
    });

    test(".defaults() (with no arguments)", async () => {
      const d = RPC.defaults();
      const request = await d("/get", options);
      assert.deepStrictEqual(request, { result });
    });

    test(".prepareOptions()", () => {
      const options1 = { baseUrl: "someurl", json: true };
      const options2 = { baseUrl: "otherurl", json: false };
      const options3 = { uri: "uri" };
      const options4 = { url: "url" };
      const error = new Error("options.uri is a required argument");
      assert.throws(() => {
        RPC.prepareOptions(options1, options2);
      }, error);

      let result = RPC.prepareOptions(options1, options3);
      assert.deepStrictEqual(result, { ...options1, uri: options3.uri });
      result = RPC.prepareOptions(options3, options2);
      assert.deepStrictEqual(result, options3);
      result = RPC.prepareOptions(options2, options4);
      assert.deepStrictEqual(result, { ...options2, uri: options4.url });
    });
  });

  suiteTeardown(done => server.close(done));
});
