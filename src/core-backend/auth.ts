// src/core-backend/auth.ts

export function isAuthorized(
  requestHeaders: Headers,
  configuredAccessToken?: string
): boolean {
  if (!configuredAccessToken) {
    // No access token configured, so all requests are authorized by this check
    return true;
  }

  const providedToken = requestHeaders.get("X-Access-Token");
  if (providedToken !== configuredAccessToken) {
    return false;
  }

  return true;
}
