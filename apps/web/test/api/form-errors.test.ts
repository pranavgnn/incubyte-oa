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
});
