import { ApiError } from "@/api/errors";

// Toast wording for a failed vehicle action, per DESIGN.md section 0.
// UNAUTHORIZED returns null: the session-expiry flow already toasts and
// redirects, so a second toast would only repeat it.
export function actionErrorMessage(error: unknown): string | null {
  if (!(error instanceof ApiError)) return "Something went wrong — please try again";
  switch (error.code) {
    case "UNAUTHORIZED":
      return null;
    case "FORBIDDEN":
      return "You don't have permission to do that";
    case "NOT_FOUND":
      return "This vehicle no longer exists";
    case "OUT_OF_STOCK":
      return "Sold out — no units left";
    default:
      return error.message;
  }
}

export function isNetworkError(error: unknown): boolean {
  return error instanceof ApiError && error.code === "NETWORK_ERROR";
}

// Errors stay up longer than confirmations so they can be read.
export const ERROR_TOAST_MS = 6000;
