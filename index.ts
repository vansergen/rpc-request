import {
  Headers,
  type HeadersInit,
  type RequestInit,
  Response,
  fetch,
} from "undici";

export type ITransformType =
  | "arrayBuffer"
  | "blob"
  | "buffer"
  | "formData"
  | "json"
  | "text";

export interface IFetchOptions extends RequestInit {
  base_url?: URL | string | null | undefined;
  transform?: ITransformType | null | undefined;
  reject?: boolean | undefined;
}

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

export class Fetch {
  readonly #transform: ITransformType | null;
  readonly #base_url: URL | null;
  readonly #reject: boolean;
  readonly #init: RequestInit;

  public constructor({
    transform = null,
    base_url = null,
    reject = true,
    ...init
  }: IFetchOptions = {}) {
    this.#init = init;
    this.#reject = reject;
    this.#transform = transform;
    this.#base_url = base_url === null ? null : new URL(base_url.toString());
  }

  public get reject(): boolean {
    return this.#reject;
  }

  public get transform(): ITransformType | null {
    return this.#transform;
  }

  public get base_url(): URL | null {
    return this.#base_url ? new URL(this.#base_url) : null;
  }

  public get init(): RequestInit {
    return this.#init;
  }

  public get<T = unknown>(path = "", init: IFetchOptions = {}): Promise<T> {
    return this.fetch<T>(path, { ...init, method: "GET" });
  }

  public head(path = "", init: IFetchOptions = {}): Promise<Response> {
    return this.fetch<Response>(path, { ...init, method: "HEAD" });
  }

  public post<T = unknown>(path = "", init: IFetchOptions = {}): Promise<T> {
    return this.fetch<T>(path, { ...init, method: "POST" });
  }

  public put<T = unknown>(path = "", init: IFetchOptions = {}): Promise<T> {
    return this.fetch<T>(path, { ...init, method: "PUT" });
  }

  public delete<T = unknown>(path = "", init: IFetchOptions = {}): Promise<T> {
    return this.fetch<T>(path, { ...init, method: "DELETE" });
  }

  public options<T = unknown>(path = "", init: IFetchOptions = {}): Promise<T> {
    return this.fetch<T>(path, { ...init, method: "OPTIONS" });
  }

  public patch<T = unknown>(path = "", init: IFetchOptions = {}): Promise<T> {
    return this.fetch<T>(path, { ...init, method: "PATCH" });
  }

  public async fetch<T = unknown>(
    path = "",
    {
      base_url = this.#base_url,
      transform = this.#transform,
      reject = this.#reject,
      ...init
    }: IFetchOptions = {},
  ): Promise<T> {
    const url =
      typeof base_url === "string" || base_url instanceof URL
        ? new URL(path, base_url)
        : new URL(path);

    const headers = Fetch.#mergeHeaders(this.#init.headers, init.headers);
    const response = await fetch(url, { ...this.#init, ...init, headers });

    if (transform === null) {
      return response as unknown as T;
    }

    // eslint-disable-next-line init-declarations
    let body: T;

    if (init.method === "HEAD") {
      body = (await response.text()) as unknown as T;
    } else if (transform === "buffer" || transform === "arrayBuffer") {
      const arrayBuffer = await response.arrayBuffer();
      const output =
        transform === "arrayBuffer" ? arrayBuffer : Buffer.from(arrayBuffer);
      body = output as unknown as T;
    } else {
      body = (await response[transform]()) as T;
    }

    if (reject && !response.ok) {
      throw new UnsuccessfulFetch(response, body);
    } else if (init.method === "HEAD") {
      return response as unknown as T;
    }

    return body;
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

export default Fetch;
