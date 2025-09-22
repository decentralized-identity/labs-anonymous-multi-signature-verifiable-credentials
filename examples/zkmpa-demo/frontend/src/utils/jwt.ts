/**
 * Decode a JWT token without verification
 * Handles URL-safe Base64 encoding
 */
export function decodeJWT(token: string): any {
  try {
    const parts = token.trim().split('.');
    if (parts.length !== 3) return null;

    // Handle URL-safe Base64
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if necessary
    while (base64.length % 4) {
      base64 += '=';
    }

    return JSON.parse(atob(base64));
  } catch (e) {
    console.error('Error decoding JWT:', e);
    return null;
  }
}

/**
 * Extract the header from a JWT token
 */
export function getJWTHeader(token: string): any {
  try {
    const parts = token.trim().split('.');
    if (parts.length !== 3) return null;

    let base64 = parts[0].replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }

    return JSON.parse(atob(base64));
  } catch (e) {
    console.error('Error decoding JWT header:', e);
    return null;
  }
}

/**
 * Check if a string is a valid JWT format
 */
export function isValidJWTFormat(token: string): boolean {
  const parts = token.trim().split('.');
  return parts.length === 3;
}