import * as request from "request-promise-native";
import { Cookie, CookieJar } from "request";

export type RPCOptions = request.RequestPromiseOptions | request.Options;

export class RPC {
  readonly _rpoptions: RPCOptions;

  constructor(options: RPCOptions = {}) {
    this._rpoptions = options;
  }

  async get(options: RPCOptions = {}): Promise<any> {
    return this.request({ ...options, method: "GET" });
  }

  async post(options: RPCOptions = {}): Promise<any> {
    return this.request({ ...options, method: "POST" });
  }

  async put(options: RPCOptions = {}): Promise<any> {
    return this.request({ ...options, method: "PUT" });
  }

  async patch(options: RPCOptions = {}): Promise<any> {
    return this.request({ ...options, method: "PATCH" });
  }

  async delete(options: RPCOptions = {}): Promise<any> {
    return this.request({ ...options, method: "DELETE" });
  }

  async head(options: RPCOptions = {}): Promise<any> {
    return this.request({ ...options, method: "HEAD" });
  }

  async options(options: RPCOptions = {}): Promise<any> {
    return this.request({ ...options, method: "OPTIONS" });
  }

  async request(options: RPCOptions = {}): Promise<any> {
    return this.defaults(RPC.prepareOptions(options, this._rpoptions));
  }

  /**
   * Create a new cookie
   */
  static cookie(key: string, value: string): Cookie | undefined {
    return request.cookie(key + "=" + value);
  }

  /**
   * Create a new cookie jar
   */
  static jar(cookieStore?: any): CookieJar {
    return request.jar(cookieStore);
  }

  static defaults(
    options: request.RequestPromiseOptions = {}
  ): request.RequestPromiseAPI {
    return request.defaults(options);
  }

  static prepareOptions(
    options: RPCOptions,
    rpoptions: RPCOptions
  ): request.Options {
    if (!("url" in options || "uri" in options)) {
      if (!("url" in rpoptions || "uri" in rpoptions)) {
        throw new Error("options.uri is a required argument");
      }
      if ("uri" in rpoptions) {
        return { ...options, uri: rpoptions.uri };
      }
      return { ...options, uri: rpoptions.url };
    }
    return options;
  }

  get defaults(): request.RequestPromiseAPI {
    return RPC.defaults(this._rpoptions);
  }
}
