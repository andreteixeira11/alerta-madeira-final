// Allow auth-related deep link paths to pass through (password reset, email
// verification) instead of redirecting everything to "/". This is critical
// for the Supabase recovery flow — clicking the email link must land on
// /reset-password, not the home screen.
const AUTH_PATHS = ['/reset-password', '/verify-email', '/forgot-password'];

export function redirectSystemPath({
  path,
  initial,
}: { path: string; initial: boolean }) {
  // Normalize: strip scheme, leading slashes, query/fragment for comparison
  const normalized = path
    .replace(/^alertamadeira:\/\//, '')
    .replace(/^app\.alerta\.madeira:\/\//, '')
    .replace(/^\//, '')
    .split('?')[0]
    .split('#')[0];

  const cleanPath = '/' + normalized;

  for (const authPath of AUTH_PATHS) {
    if (cleanPath.startsWith(authPath)) {
      return cleanPath;
    }
  }

  // Default: redirect to home for all other paths
  return '/';
}
