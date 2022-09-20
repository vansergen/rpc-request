import { fetch, RequestInit, Response, Headers, HeadersInit } from "undici";

export type ITransformType =
  | "arrayBuffer"
  | "blob"
  | "buffer"
  | "json"
  | "raw"
  | "text";

export interface IFetchOptions {
  base_url?: URL | string | undefined;
  transform?: ITransformType | undefined;
  reject?: boolean | undefined;
}

export const DefaultTransform = "raw";

export class UnsuccessfulFetch extends Error {
  readonly #response: Response;
  readonly #data: unknown;

  public constructor(response: Response, data?: unknown) {
    super(response.statusText);
    this.name = "UnsuccessfulFetch";
    this.#response = response;
    this.#data = data;
  }

  public get data(): unknown {
    return this.#data;
  }

  public get response(): Response {
    return this.#response;
  }
}

export class FetchClient<T = Response> {
  readonly #transform: ITransformType;
  readonly #base_url?: URL;
  readonly #reject: boolean;
  #init: RequestInit;

  public constructor(
    { transform, base_url, reject }: IFetchOptions = {},
    init: RequestInit = {}
  ) {
    this.#init = { ...init, headers: new Headers(init.headers) };
    this.#reject = reject ?? true;
    this.#transform = transform ?? DefaultTransform;
    if (typeof base_url !== "undefined") {
      this.#base_url = new URL(base_url.toString());
    }
  }

  public get fetchOptions(): RequestInit {
    return this.#init;
  }

  public set fetchOptions(options: RequestInit) {
    const headers = FetchClient.#mergeHeaders(
      this.#init.headers,
      options.headers
    );
    this.#init = { ...this.#init, ...options, headers };
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

  public patch(path = "", _fetchOptions: RequestInit = {}): Promise<T> {
    return this.fetch(path, { ..._fetchOptions, method: "PATCH" });
  }

  public async fetch(path = "", options: RequestInit = {}): Promise<T> {
    const url = new URL(path, this.#base_url).toString();
    const headers = FetchClient.#mergeHeaders(
      this.#init.headers,
      options.headers
    );
    const init = { ...this.#init, ...options, headers };
    const response = await fetch(url, init);

    if (this.#reject && !response.ok) {
      throw new UnsuccessfulFetch(response);
    } else if (this.#transform === "raw") {
      return response as unknown as T;
    } else if (
      this.#transform === "buffer" ||
      this.#transform === "arrayBuffer"
    ) {
      const arrayBuffer = await response.arrayBuffer();

      const output: unknown =
        this.#transform === "arrayBuffer"
          ? arrayBuffer
          : Buffer.from(arrayBuffer);

      return output as T;
    }

    const data = (await response[this.#transform]()) as T;
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
