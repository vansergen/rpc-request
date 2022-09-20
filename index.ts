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

export class FetchClient {
  readonly #transform: ITransformType;
  readonly #base_url: URL | null;
  readonly #reject: boolean;
  #init: RequestInit;

  public constructor(
    { transform, base_url, reject }: IFetchOptions = {},
    init: RequestInit = {}
  ) {
    this.#init = { ...init, headers: new Headers(init.headers) };
    this.#reject = reject ?? true;
    this.#transform = transform ?? DefaultTransform;
    this.#base_url =
      typeof base_url === "undefined" ? null : new URL(base_url.toString());
  }

  public get init(): RequestInit {
    return this.#init;
  }

  public get<T = unknown>(path = "", init: RequestInit = {}): Promise<T> {
    return this.fetch<T>(path, { ...init, method: "GET" });
  }

  public head<T = unknown>(path = "", init: RequestInit = {}): Promise<T> {
    return this.fetch<T>(path, { ...init, method: "HEAD" });
  }

  public post<T = unknown>(path = "", init: RequestInit = {}): Promise<T> {
    return this.fetch<T>(path, { ...init, method: "POST" });
  }

  public put<T = unknown>(path = "", init: RequestInit = {}): Promise<T> {
    return this.fetch<T>(path, { ...init, method: "PUT" });
  }

  public delete<T = unknown>(path = "", init: RequestInit = {}): Promise<T> {
    return this.fetch<T>(path, { ...init, method: "DELETE" });
  }

  public options<T = unknown>(path = "", init: RequestInit = {}): Promise<T> {
    return this.fetch<T>(path, { ...init, method: "OPTIONS" });
  }

  public patch<T = unknown>(path = "", init: RequestInit = {}): Promise<T> {
    return this.fetch<T>(path, { ...init, method: "PATCH" });
  }

  public async fetch<T = unknown>(
    path = "",
    options: RequestInit = {}
  ): Promise<T> {
    const url = this.#base_url ? new URL(path, this.#base_url) : new URL(path);
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
