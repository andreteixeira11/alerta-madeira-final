import { t } from '@/utils/i18n';

const ERROR_MAP: Record<string, ReturnType<typeof t>> = {
  'Invalid login credentials': t('error.invalidCredentials'),
  'Email not confirmed': t('error.emailNotConfirmed'),
  'User already registered': t('error.userAlreadyRegistered'),
  'Password should be at least 6 characters': t('auth.passwordTooShort'),
  'Signup requires a valid password': t('error.validPasswordRequired'),
  'Unable to validate email address: invalid format': t('error.invalidEmailFormat'),
  'Email rate limit exceeded': t('error.rateLimit'),
  'For security purposes, you can only request this after': t('error.securityWait'),
  'New password should be different from the old password': t('error.newPasswordDifferent'),
  'Auth session missing': t('error.authSessionMissing'),
  'JWT expired': t('error.jwtExpired'),
  'Token has expired or is invalid': t('error.tokenExpired'),
  'Invalid API key': t('auth.loginTemporarilyUnavailable'),
  'invalid api key': t('auth.loginTemporarilyUnavailable'),
  'User not found': t('error.userNotFound'),
  'Network request failed': t('error.networkRequestFailed'),
  'Failed to fetch': t('error.networkRequestFailed'),
  'TypeError: Network request failed': t('error.networkRequestFailed'),
  'row-level security': t('error.permissionDenied'),
  'violates row-level security policy': t('error.permissionDenied'),
  'duplicate key value': t('error.duplicateRecord'),
  'foreign key constraint': t('error.foreignKeyConstraint'),
  'Could not find': t('error.resourceNotFound'),
  'relation': t('error.serverRelationNotFound'),
};

export function translateError(error: unknown): string {
  if (!error) return t('error.unknown');

  let message = '';

  if (typeof error === 'string') {
    message = error;
  } else if (typeof (error as { message?: unknown })?.message === 'string') {
    message = (error as { message: string }).message;
  } else {
    message = t('error.unknown');
  }

  for (const [key, translation] of Object.entries(ERROR_MAP)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return translation;
    }
  }

  if (message.startsWith('For security purposes')) {
    const match = message.match(/after (\d+) seconds/);
    if (match) {
      return t('error.securityWaitSeconds', { seconds: match[1] });
    }
    return t('error.securityWait');
  }

  return message;
}
