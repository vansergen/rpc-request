import fetch, { RequestInit, Response, Headers } from "node-fetch";
import { UnsuccessfulFetch } from "./error.js";

export type ITransformType =
  | "buffer"
  | "arrayBuffer"
  | "blob"
  | "json"
  | "text"
  | "raw";

export interface FetchClientOptions {
  baseUrl?: string | URL;
  transform?: ITransformType;
  rejectNotOk?: boolean;
}

export interface IClientOptions extends FetchClientOptions {
  transform: ITransformType;
  rejectNotOk: boolean;
}

export const DefaultTransform = "raw";

export class FetchClient<T = Response> {
  #fetchOptions: RequestInit;

  readonly #clientOptions: IClientOptions;

  public constructor(
    fetchOptions: RequestInit = {},
    {
      rejectNotOk = true,
      transform = DefaultTransform,
      baseUrl,
    }: FetchClientOptions = {}
  ) {
    const headers = new Headers(fetchOptions.headers);
    this.#fetchOptions = { ...fetchOptions, headers };
    this.#clientOptions = { rejectNotOk, baseUrl, transform };
  }

  public get fetchOptions(): RequestInit {
    return this.#fetchOptions;
  }

  public set fetchOptions(options: RequestInit) {
    this.#fetchOptions = FetchClient.#mergeFetchOptions(
      this.#fetchOptions,
      options
    );
  }

  public get(path = "", _fetchOptions: RequestInit = {}): Promise<T> {
    return this.fetch(path, { ..._fetchOptions, method: "GET" });
  }

  public head(path = "", _fetchOptions: RequestInit = {}): Promise<T> {
    return this.fetch(path, { ..._fetchOptions, method: "HEAD" });
  }

  public post(path = "", _fetchOptions: RequestInit = {}): Promise<T> {
    return this.fetch(path, { ..._fetchOptions, method: "POST" });
  }

  public put(path = "", _fetchOptions: RequestInit = {}): Promise<T> {
    return this.fetch(path, { ..._fetchOptions, method: "PUT" });
  }

  public delete(path = "", _fetchOptions: RequestInit = {}): Promise<T> {
    return this.fetch(path, { ..._fetchOptions, method: "DELETE" });
  }

  public options(path = "", _fetchOptions: RequestInit = {}): Promise<T> {
    return this.fetch(path, { ..._fetchOptions, method: "OPTIONS" });
  }

  public trace(path = "", _fetchOptions: RequestInit = {}): Promise<T> {
    return this.fetch(path, { ..._fetchOptions, method: "TRACE" });
  }

  public patch(path = "", _fetchOptions: RequestInit = {}): Promise<T> {
    return this.fetch(path, { ..._fetchOptions, method: "PATCH" });
  }

  public async fetch(path = "", options: RequestInit = {}): Promise<T> {
    const { baseUrl, rejectNotOk, transform } = this.#clientOptions;
    const url = new URL(path, baseUrl).toString();
    const fetchOptions = FetchClient.#mergeFetchOptions(
      this.#fetchOptions,
      options
    );
    const response = await fetch(url, fetchOptions);

    if (rejectNotOk && !response.ok) {
      throw new UnsuccessfulFetch(response.statusText, response);
    } else if (transform === "raw") {
      return response as unknown as T;
    }

    const data = (await response[transform]()) as T;
    return data;
  }

  static #mergeFetchOptions(
    { headers: headers1, ...rest1 }: RequestInit,
    { headers: headers2, ...rest2 }: RequestInit
  ): RequestInit {
    const headers = new Headers(headers1);
    const _headers = new Headers(headers2);
    for (const [key, value] of _headers) {
      headers.set(key, value);
    }
    return { ...rest1, ...rest2, headers };
  }
}

export default FetchClient;
