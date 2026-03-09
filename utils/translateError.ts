const ERROR_MAP: Record<string, string> = {
  'Invalid login credentials': 'Credenciais inválidas. Verifique o email e a palavra-passe.',
  'Email not confirmed': 'O email ainda não foi confirmado.',
  'User already registered': 'Este email já está registado.',
  'Password should be at least 6 characters': 'A palavra-passe deve ter pelo menos 6 caracteres.',
  'Signup requires a valid password': 'É necessária uma palavra-passe válida.',
  'Unable to validate email address: invalid format': 'Formato de email inválido.',
  'Email rate limit exceeded': 'Demasiadas tentativas. Aguarde alguns minutos.',
  'For security purposes, you can only request this after': 'Por segurança, aguarde antes de tentar novamente.',
  'New password should be different from the old password': 'A nova palavra-passe deve ser diferente da anterior.',
  'Auth session missing': 'Sessão expirada. Faça login novamente.',
  'JWT expired': 'Sessão expirada. Faça login novamente.',
  'Token has expired or is invalid': 'Token expirado ou inválido.',
  'User not found': 'Utilizador não encontrado.',
  'Network request failed': 'Erro de ligação. Verifique a sua internet.',
  'Failed to fetch': 'Erro de ligação. Verifique a sua internet.',
  'TypeError: Network request failed': 'Erro de ligação. Verifique a sua internet.',
  'row-level security': 'Sem permissão para esta ação. Contacte o administrador.',
  'violates row-level security policy': 'Sem permissão para esta ação. Contacte o administrador.',
  'duplicate key value': 'Este registo já existe.',
  'foreign key constraint': 'Erro de referência nos dados. Tente novamente.',
  'Could not find': 'Recurso não encontrado no servidor.',
  'relation': 'Tabela não encontrada no servidor.',
};

export function translateError(error: unknown): string {
  if (!error) return 'Ocorreu um erro desconhecido.';

  const message = typeof error === 'string'
    ? error
    : (error as any)?.message ?? String(error);

  for (const [key, translation] of Object.entries(ERROR_MAP)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return translation;
    }
  }

  if (message.startsWith('For security purposes')) {
    const match = message.match(/after (\d+) seconds/);
    if (match) {
      return `Por segurança, aguarde ${match[1]} segundos antes de tentar novamente.`;
    }
    return 'Por segurança, aguarde antes de tentar novamente.';
  }

  return message;
}
