import type { z } from "zod";

// UI wording for the auth schemas' built-in checks. Passed per parse, so
// the API's own schemas are reused unchanged and any message they define
// themselves (such as the 72-byte password limit) still wins.
export const authFormErrorMap: z.core.$ZodErrorMap = (issue) => {
  if (issue.code === "invalid_format" && issue.format === "email") {
    return "Enter a valid email address";
  }
  if (issue.code === "too_small" && issue.origin === "string") {
    return issue.minimum === 1 ? "Enter your password" : `Use at least ${issue.minimum} characters`;
  }
  return undefined;
};
