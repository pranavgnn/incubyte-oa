import { describe, expect, it } from "vitest";
import { ApiError } from "@/api/errors";
import { toFormErrors } from "@/api/form-errors";

const fields = ["email", "password"] as const;

describe("toFormErrors", () => {
  it("maps VALIDATION_ERROR details onto the fields they name", () => {
    const error = new ApiError(400, "VALIDATION_ERROR", "Request validation failed", [
      { path: ["email"], message: "Invalid email address" },
      { path: ["password"], message: "Too small: expected string to have >=8 characters" },
    ]);

    expect(toFormErrors(error, fields)).toEqual({
      fieldErrors: [
        { field: "email", message: "Invalid email address" },
        { field: "password", message: "Too small: expected string to have >=8 characters" },
      ],
      formError: null,
    });
  });

  it("shows the message in the form alert when a detail cannot be placed on a field", () => {
    const error = new ApiError(400, "VALIDATION_ERROR", "Malformed JSON body", [
      { path: [], message: 'Unrecognized key: "role"' },
    ]);

    expect(toFormErrors(error, fields)).toEqual({
      fieldErrors: [],
      formError: "Malformed JSON body",
    });
  });

  it("shows the message in the form alert for any other API error", () => {
    const error = new ApiError(0, "NETWORK_ERROR", "Network error — check your connection");

    expect(toFormErrors(error, fields)).toEqual({
      fieldErrors: [],
      formError: "Network error — check your connection",
    });
  });

  it("falls back to a generic alert for errors that are not from the API", () => {
    expect(toFormErrors(new TypeError("boom"), fields)).toEqual({
      fieldErrors: [],
      formError: "Something went wrong — please try again",
    });
  });
});
