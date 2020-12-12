import type fetch from "node-fetch";

export class UnsuccessfulFetch extends Error {
  readonly #response: fetch.Response;

  public constructor(message: string, response: fetch.Response) {
    super(message);
    this.name = "UnsuccessfulFetch";
    this.#response = response;
  }

  public get response(): fetch.Response {
    return this.#response;
  }
}
