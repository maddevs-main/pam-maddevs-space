
export function getBaseUrl() {
  // In the browser, we can use the window object.
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // On the server, we use environment variables.
  // 1. The canonical URL of the site. This is the recommended approach.
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  // 2. Vercel automatically sets the VERCEL_URL environment variable.
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // 3. For production, fall back to the custom domain as a last resort.
  if (process.env.NODE_ENV === 'production') {
    return 'https://pam.maddevs.space';
  }

  // 4. For local development, fall back to localhost.
  return 'http://localhost:3000';
}
