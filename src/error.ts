import type { Response } from "node-fetch";

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
