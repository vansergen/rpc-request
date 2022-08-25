import fetch, { RequestInit, Response, Headers, HeadersInit } from "node-fetch";

export type ITransformType =
  | "arrayBuffer"
  | "blob"
  | "buffer"
  | "json"
  | "raw"
  | "text";

export interface FetchClientOptions {
  baseUrl?: URL | string | undefined;
  transform?: ITransformType | undefined;
  rejectNotOk?: boolean | undefined;
}

export interface IClientOptions extends FetchClientOptions {
  transform: ITransformType;
  rejectNotOk: boolean;
}

export const DefaultTransform = "raw";

export class UnsuccessfulFetch extends Error {
  readonly #response: Response;

  public constructor(message: string, response: Response) {
    super(message);
    this.name = "UnsuccessfulFetch";
    this.#response = response;
  }

  public get response(): Response {
    return this.#response;
  }
}

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
    const headers = FetchClient.#mergeHeaders(
      this.#fetchOptions.headers,
      options.headers
    );
    this.#fetchOptions = { ...this.#fetchOptions, ...options, headers };
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
    const headers = FetchClient.#mergeHeaders(
      this.#fetchOptions.headers,
      options.headers
    );
    const fetchOptions = { ...this.#fetchOptions, ...options, headers };
    const response = await fetch(url, fetchOptions);

    if (rejectNotOk && !response.ok) {
      throw new UnsuccessfulFetch(response.statusText, response);
    } else if (transform === "raw") {
      return response as unknown as T;
    }

    const data = (await response[transform]()) as T;
    return data;
  }

  static #mergeHeaders(...headersInit: (HeadersInit | undefined)[]): Headers {
    const out = new Headers();
    for (const init of headersInit) {
      const headers = new Headers(init);
      for (const [key, value] of headers) {
        out.set(key, value);
      }
    }
    return out;
  }
}

export default FetchClient;
