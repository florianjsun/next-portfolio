const TEMPORARY_FILE_HOST_PARTS = ["notion-static.com", "prod-files-secure"];

export function isSiteRelativeUrl(value: string): boolean {
  return (
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\") &&
    !/[\u0000-\u001f\u007f]/.test(value)
  );
}

export function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export function isTemporaryNotionFileUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const hasTemporarySignature = [...url.searchParams.keys()].some((key) =>
      key.toLowerCase().startsWith("x-amz-")
    );

    return (
      hasTemporarySignature ||
      TEMPORARY_FILE_HOST_PARTS.some((part) =>
        url.hostname.toLowerCase().includes(part)
      )
    );
  } catch {
    return false;
  }
}

export function isStableContentUrl(value: string): boolean {
  return (
    (isSiteRelativeUrl(value) || isHttpsUrl(value)) &&
    !isTemporaryNotionFileUrl(value)
  );
}
