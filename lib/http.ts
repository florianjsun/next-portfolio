import "server-only";

const DEFAULT_REQUEST_TIMEOUT_MS = 10_000;

export function createRequestTimeoutSignal(
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS
): AbortSignal {
  return AbortSignal.timeout(timeoutMs);
}
