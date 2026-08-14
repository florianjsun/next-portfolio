import "server-only";

const DEFAULT_REQUEST_TIMEOUT_MS = 10_000;

export function createRequestTimeoutSignal(
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS
): AbortSignal {
  return AbortSignal.timeout(timeoutMs);
}

export async function readRequestBody(
  request: Request,
  maxBytes: number
): Promise<string | null> {
  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const declaredBytes = Number(contentLength);
    if (Number.isFinite(declaredBytes) && declaredBytes > maxBytes) {
      return null;
    }
  }

  if (!request.body) {
    return "";
  }

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let bytesRead = 0;
  let body = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        return body + decoder.decode();
      }

      bytesRead += value.byteLength;
      if (bytesRead > maxBytes) {
        await reader.cancel().catch(() => undefined);
        return null;
      }

      body += decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }
}
