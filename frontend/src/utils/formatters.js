/**
 * Shared formatting and API-error helpers for the React frontend.
 * Keep these functions free of React so any component or page can use them.
 */

/** Format a monetary value with thousands separators and two decimal places. */
export function formatMoney(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return "—";

  return `$ ${amount.toLocaleString("en-PK", {
    // minimumFractionDigits: 2,
    // maximumFractionDigits: 2,
  })}`;
}

/** Format a date/time, returning a fallback for missing or invalid dates. */
export function formatDate(value, fallback = "—") {
  if (!value) return fallback;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return fallback;

  return date.toLocaleString();
}

/** Extract a readable message from common Django REST Framework/Axios errors. */
export function getErrorMessage(
  error,
  fallback = "Something went wrong. Please try again.",
) {
  const data = error?.response?.data;

  if (typeof data === "string") {
    return data;
  }

  if (data?.detail) {
    return data.detail;
  }

  if (data && typeof data === "object") {
    for (const value of Object.values(data)) {
      if (typeof value === "string") {
        return value;
      }

      if (Array.isArray(value) && value.length > 0) {
        return String(value[0]);
      }
    }
  }

  return error?.message || fallback;
}

/** Return the Bootstrap background class for an order status. */
export function getStatusClass(status) {
  switch (status) {
    case "paid":
      return "bg-success";
    case "pending":
      return "bg-warning text-dark";
    case "failed":
      return "bg-danger";
    case "cancelled":
      return "bg-secondary";
    default:
      return "bg-secondary";
  }
}

/** Return the Bootstrap text class for a payment-attempt status. */
export function getPaymentStatusClass(status) {
  switch (status) {
    case "succeeded":
      return "text-success";
    case "failed":
      return "text-danger";
    case "refunded":
      return "text-secondary";
    case "requires_payment":
      return "text-warning-emphasis";
    default:
      return "text-muted";
  }
}
