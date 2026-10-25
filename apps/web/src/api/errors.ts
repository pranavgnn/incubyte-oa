// The API's error response, surfaced to the UI as a throwable value.
// The UI branches on `code`, never on HTTP status text.
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details: unknown[] = [],
  ) {
    super(message);
    this.name = "ApiError";
  }
}
