import { NativeModules, Platform } from 'react-native';

type SupportedLanguage = 'pt' | 'en' | 'es' | 'fr';

type TranslationParams = Record<string, string | number>;

type TranslationKey =
  | 'common.error'
  | 'common.success'
  | 'common.ok'
  | 'common.cancel'
  | 'common.continue'
  | 'common.save'
  | 'common.loading'
  | 'common.user'
  | 'nav.back'
  | 'tabs.incidents'
  | 'tabs.operationStop'
  | 'tabs.lostFound'
  | 'tabs.anomalies'
  | 'tabs.profile'
  | 'home.appName'
  | 'auth.email'
  | 'auth.password'
  | 'auth.confirmPassword'
  | 'auth.newPassword'
  | 'auth.username'
  | 'auth.login'
  | 'auth.register'
  | 'auth.createAccount'
  | 'auth.alreadyHaveAccount'
  | 'auth.noAccount'
  | 'auth.rememberMe'
  | 'auth.forgotPassword'
  | 'auth.adminAccess'
  | 'auth.privacyPolicy'
  | 'auth.contacts'
  | 'auth.fillEmailPassword'
  | 'auth.fillAllFields'
  | 'auth.passwordMismatch'
  | 'auth.passwordTooShort'
  | 'auth.loginChecking'
  | 'auth.loginSuccess'
  | 'auth.loginTemporarilyUnavailable'
  | 'auth.loginConnectionIssue'
  | 'auth.subtitle'
  | 'auth.registerSubtitle'
  | 'auth.resetSubtitle'
  | 'auth.verifyCode'
  | 'auth.verifyCodeSubtitle'
  | 'auth.verifyResetSubtitle'
  | 'auth.enterFullCode'
  | 'auth.emailVerified'
  | 'auth.emailVerifiedSuccess'
  | 'auth.codeSentTitle'
  | 'auth.codeSentBody'
  | 'auth.resendCode'
  | 'auth.sending'
  | 'auth.resendCodeIn'
  | 'auth.verificationIncomplete'
  | 'auth.passwordUpdated'
  | 'auth.enterNewPassword'
  | 'auth.forgotPasswordTitle'
  | 'auth.forgotPasswordSubtitle'
  | 'auth.sendCode'
  | 'auth.enterEmail'
  | 'auth.adminTitle'
  | 'auth.adminSubtitle'
  | 'auth.adminLoginTitle'
  | 'auth.adminLoginDescription'
  | 'auth.adminChecking'
  | 'auth.adminConfirmed'
  | 'auth.adminEmail'
  | 'auth.adminNoPermission'
  | 'auth.adminPermissionCheckError'
  | 'auth.authorizedAdminsOnly'
  | 'auth.continueWithApple'
  | 'auth.continueWithGoogle'
  | 'auth.socialSetupRequired'
  | 'auth.appleChecking'
  | 'auth.appleUnavailable'
  | 'auth.appleOnlyOnIOS'
  | 'auth.appleMissingToken'
  | 'auth.appleCanceled'
  | 'profile.updatedName'
  | 'profile.updateNameError'
  | 'profile.changedPassword'
  | 'profile.changePasswordError'
  | 'profile.galleryPermission'
  | 'profile.galleryPermissionBody'
  | 'profile.avatarUploadWarning'
  | 'profile.avatarUpdated'
  | 'profile.avatarUpdateError'
  | 'profile.galleryOpenError'
  | 'profile.logoutTitle'
  | 'profile.logoutBody'
  | 'profile.logout'
  | 'profile.newName'
  | 'profile.deleteAccount'
  | 'profile.deleteAccountTitle'
  | 'profile.deleteAccountBody'
  | 'profile.deleteAccountConfirm'
  | 'profile.deleteAccountSuccess'
  | 'profile.deleteAccountError'
  | 'profile.deleteAccountInProgress'
  | 'profile.deleteAccountDataWarning'
  | 'error.unknown'
  | 'error.invalidCredentials'
  | 'error.emailNotConfirmed'
  | 'error.userAlreadyRegistered'
  | 'error.validPasswordRequired'
  | 'error.invalidEmailFormat'
  | 'error.rateLimit'
  | 'error.securityWait'
  | 'error.securityWaitSeconds'
  | 'error.newPasswordDifferent'
  | 'error.authSessionMissing'
  | 'error.jwtExpired'
  | 'error.tokenExpired'
  | 'error.userNotFound'
  | 'error.networkRequestFailed'
  | 'error.permissionDenied'
  | 'error.duplicateRecord'
  | 'error.foreignKeyConstraint'
  | 'error.resourceNotFound'
  | 'error.serverRelationNotFound';

type TranslationDictionary = Record<SupportedLanguage, Record<TranslationKey, string>>;

const translations: TranslationDictionary = {
  pt: {
    'common.error': 'Erro',
    'common.success': 'Sucesso',
    'common.ok': 'OK',
    'common.cancel': 'Cancelar',
    'common.continue': 'Continuar',
    'common.save': 'Guardar',
    'common.loading': 'A carregar...',
    'common.user': 'Utilizador',
    'nav.back': 'Voltar',
    'tabs.incidents': 'Ocorrências',
    'tabs.operationStop': 'Op. Stop',
    'tabs.lostFound': 'Perdidos',
    'tabs.anomalies': 'Anomalias',
    'tabs.profile': 'Perfil',
    'home.appName': 'Alerta Madeira',
    'auth.email': 'Email',
    'auth.password': 'Palavra-passe',
    'auth.confirmPassword': 'Confirmar palavra-passe',
    'auth.newPassword': 'Nova palavra-passe',
    'auth.username': 'Nome de utilizador',
    'auth.login': 'Entrar',
    'auth.register': 'Registar',
    'auth.createAccount': 'Criar Conta',
    'auth.alreadyHaveAccount': 'Já tem conta?',
    'auth.noAccount': 'Não tem conta?',
    'auth.rememberMe': 'Memorizar dados',
    'auth.forgotPassword': 'Esqueceu a senha?',
    'auth.adminAccess': 'Acesso Administração',
    'auth.privacyPolicy': 'Política de Privacidade',
    'auth.contacts': 'Contactos',
    'auth.fillEmailPassword': 'Preencha o email e a palavra-passe para continuar.',
    'auth.fillAllFields': 'Preencha todos os campos.',
    'auth.passwordMismatch': 'As palavras-passe não coincidem.',
    'auth.passwordTooShort': 'A palavra-passe deve ter pelo menos 6 caracteres.',
    'auth.loginChecking': 'A validar acesso...',
    'auth.loginSuccess': 'Login efetuado com sucesso.',
    'auth.loginTemporarilyUnavailable': 'Não foi possível concluir o login agora. Tente novamente dentro de instantes.',
    'auth.loginConnectionIssue': 'Falha temporária ao comunicar com o serviço de autenticação. Tente novamente dentro de instantes.',
    'auth.subtitle': 'Proteje a Comunidade! Publica já!',
    'auth.registerSubtitle': 'Junte-se à comunidade Alerta Madeira',
    'auth.resetSubtitle': 'Defina a sua nova palavra-passe',
    'auth.verifyCode': 'Verificar Código',
    'auth.verifyCodeSubtitle': 'Insira o código enviado para o seu email para verificar a sua conta',
    'auth.verifyResetSubtitle': 'Insira o código enviado para o seu email para redefinir a palavra-passe',
    'auth.enterFullCode': 'Insira o código completo de 6 dígitos.',
    'auth.emailVerified': 'Email verificado',
    'auth.emailVerifiedSuccess': 'Email verificado com sucesso! Bem-vindo ao Alerta Madeira.',
    'auth.codeSentTitle': 'Código Enviado',
    'auth.codeSentBody': 'Um novo código foi enviado para o seu email.',
    'auth.resendCode': 'Reenviar código',
    'auth.sending': 'A enviar...',
    'auth.resendCodeIn': 'Reenviar código ({seconds}s)',
    'auth.verificationIncomplete': 'Verificação não concluída.',
    'auth.passwordUpdated': 'Palavra-passe atualizada com sucesso!',
    'auth.enterNewPassword': 'Insira a nova palavra-passe.',
    'auth.forgotPasswordTitle': 'Recuperar Palavra-passe',
    'auth.forgotPasswordSubtitle': 'Enviaremos um código de verificação para o seu email.',
    'auth.sendCode': 'Enviar Código',
    'auth.enterEmail': 'Insira o seu email.',
    'auth.adminTitle': 'Administração',
    'auth.adminSubtitle': 'Alerta Madeira · Backoffice',
    'auth.adminLoginTitle': 'Login de Administrador',
    'auth.adminLoginDescription': 'Apenas contas com permissões de administrador podem aceder ao painel.',
    'auth.adminChecking': 'A validar permissões de administrador...',
    'auth.adminConfirmed': 'Acesso de administrador confirmado.',
    'auth.adminEmail': 'Email do administrador',
    'auth.adminNoPermission': 'Esta conta não tem permissões de administrador.',
    'auth.adminPermissionCheckError': 'Erro ao verificar permissões.',
    'auth.authorizedAdminsOnly': 'Acesso seguro · Apenas administradores autorizados',
    'auth.continueWithApple': 'Continuar com Apple',
    'auth.continueWithGoogle': 'Continuar com Google',
    'auth.socialSetupRequired': 'Login social em preparação. Assim que configurar Apple e Google, esta opção ficará ativa.',
    'auth.appleChecking': 'A validar conta Apple...',
    'auth.appleUnavailable': 'Sign in with Apple não está disponível neste dispositivo.',
    'auth.appleOnlyOnIOS': 'Esta opção está disponível apenas no iPhone e iPad.',
    'auth.appleMissingToken': 'A Apple não devolveu um token de autenticação válido.',
    'auth.appleCanceled': 'O início de sessão com Apple foi cancelado.',
    'profile.updatedName': 'Nome atualizado com sucesso.',
    'profile.updateNameError': 'Erro ao atualizar nome.',
    'profile.changedPassword': 'Palavra-passe alterada com sucesso.',
    'profile.changePasswordError': 'Erro ao alterar palavra-passe.',
    'profile.galleryPermission': 'Permissão Necessária',
    'profile.galleryPermissionBody': 'Precisamos de acesso à galeria.',
    'profile.avatarUploadWarning': 'Erro ao fazer upload da fotografia. Verifique a configuração do armazenamento.',
    'profile.avatarUpdated': 'Fotografia de perfil atualizada.',
    'profile.avatarUpdateError': 'Erro ao atualizar fotografia.',
    'profile.galleryOpenError': 'Não foi possível abrir a galeria.',
    'profile.logoutTitle': 'Terminar Sessão',
    'profile.logoutBody': 'Tem a certeza que deseja sair?',
    'profile.logout': 'Sair',
    'profile.newName': 'Novo nome',
    'profile.deleteAccount': 'Eliminar conta',
    'profile.deleteAccountTitle': 'Eliminar conta permanentemente',
    'profile.deleteAccountBody': 'Esta ação apaga a sua conta, publicações, comentários e tokens de notificações. Não pode ser desfeita.',
    'profile.deleteAccountConfirm': 'Sim, eliminar conta',
    'profile.deleteAccountSuccess': 'A sua conta foi eliminada com sucesso.',
    'profile.deleteAccountError': 'Não foi possível eliminar a conta.',
    'profile.deleteAccountInProgress': 'A eliminar conta...',
    'profile.deleteAccountDataWarning': 'Os dados associados serão removidos de forma permanente.',
    'error.unknown': 'Ocorreu um erro desconhecido.',
    'error.invalidCredentials': 'Credenciais inválidas. Verifique o email e a palavra-passe.',
    'error.emailNotConfirmed': 'O email ainda não foi confirmado.',
    'error.userAlreadyRegistered': 'Este email já está registado.',
    'error.validPasswordRequired': 'É necessária uma palavra-passe válida.',
    'error.invalidEmailFormat': 'Formato de email inválido.',
    'error.rateLimit': 'Demasiadas tentativas. Aguarde alguns minutos.',
    'error.securityWait': 'Por segurança, aguarde antes de tentar novamente.',
    'error.securityWaitSeconds': 'Por segurança, aguarde {seconds} segundos antes de tentar novamente.',
    'error.newPasswordDifferent': 'A nova palavra-passe deve ser diferente da anterior.',
    'error.authSessionMissing': 'Sessão expirada. Faça login novamente.',
    'error.jwtExpired': 'Sessão expirada. Faça login novamente.',
    'error.tokenExpired': 'Token expirado ou inválido.',
    'error.userNotFound': 'Utilizador não encontrado.',
    'error.networkRequestFailed': 'Falha temporária de ligação. Tente novamente dentro de instantes.',
    'error.permissionDenied': 'Sem permissão para esta ação. Contacte o administrador.',
    'error.duplicateRecord': 'Este registo já existe.',
    'error.foreignKeyConstraint': 'Erro de referência nos dados. Tente novamente.',
    'error.resourceNotFound': 'Recurso não encontrado no servidor.',
    'error.serverRelationNotFound': 'Tabela não encontrada no servidor.',
  },
  en: {
    'common.error': 'Error',
    'common.success': 'Success',
    'common.ok': 'OK',
    'common.cancel': 'Cancel',
    'common.continue': 'Continue',
    'common.save': 'Save',
    'common.loading': 'Loading...',
    'common.user': 'User',
    'nav.back': 'Back',
    'tabs.incidents': 'Incidents',
    'tabs.operationStop': 'Op. Stop',
    'tabs.lostFound': 'Lost & Found',
    'tabs.anomalies': 'Anomalies',
    'tabs.profile': 'Profile',
    'home.appName': 'Alerta Madeira',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm password',
    'auth.newPassword': 'New password',
    'auth.username': 'Username',
    'auth.login': 'Sign in',
    'auth.register': 'Register',
    'auth.createAccount': 'Create account',
    'auth.alreadyHaveAccount': 'Already have an account?',
    'auth.noAccount': "Don't have an account?",
    'auth.rememberMe': 'Remember me',
    'auth.forgotPassword': 'Forgot password?',
    'auth.adminAccess': 'Admin access',
    'auth.privacyPolicy': 'Privacy Policy',
    'auth.contacts': 'Contacts',
    'auth.fillEmailPassword': 'Enter your email and password to continue.',
    'auth.fillAllFields': 'Please fill in all fields.',
    'auth.passwordMismatch': 'Passwords do not match.',
    'auth.passwordTooShort': 'Password must be at least 6 characters.',
    'auth.loginChecking': 'Checking access...',
    'auth.loginSuccess': 'Signed in successfully.',
    'auth.loginTemporarilyUnavailable': 'We could not complete sign in right now. Please try again in a moment.',
    'auth.loginConnectionIssue': 'Temporary issue communicating with the authentication service. Please try again in a moment.',
    'auth.subtitle': 'Protect the community. Share alerts fast.',
    'auth.registerSubtitle': 'Join the Alerta Madeira community',
    'auth.resetSubtitle': 'Set your new password',
    'auth.verifyCode': 'Verify Code',
    'auth.verifyCodeSubtitle': 'Enter the code sent to your email to verify your account',
    'auth.verifyResetSubtitle': 'Enter the code sent to your email to reset your password',
    'auth.enterFullCode': 'Enter the full 6-digit code.',
    'auth.emailVerified': 'Email verified',
    'auth.emailVerifiedSuccess': 'Email verified successfully! Welcome to Alerta Madeira.',
    'auth.codeSentTitle': 'Code Sent',
    'auth.codeSentBody': 'A new code was sent to your email.',
    'auth.resendCode': 'Resend code',
    'auth.sending': 'Sending...',
    'auth.resendCodeIn': 'Resend code ({seconds}s)',
    'auth.verificationIncomplete': 'Verification not completed.',
    'auth.passwordUpdated': 'Password updated successfully!',
    'auth.enterNewPassword': 'Enter the new password.',
    'auth.forgotPasswordTitle': 'Reset Password',
    'auth.forgotPasswordSubtitle': 'We will send a verification code to your email.',
    'auth.sendCode': 'Send Code',
    'auth.enterEmail': 'Enter your email.',
    'auth.adminTitle': 'Administration',
    'auth.adminSubtitle': 'Alerta Madeira · Backoffice',
    'auth.adminLoginTitle': 'Administrator Login',
    'auth.adminLoginDescription': 'Only accounts with administrator permissions can access the dashboard.',
    'auth.adminChecking': 'Checking administrator permissions...',
    'auth.adminConfirmed': 'Administrator access confirmed.',
    'auth.adminEmail': 'Administrator email',
    'auth.adminNoPermission': 'This account does not have administrator permissions.',
    'auth.adminPermissionCheckError': 'Unable to verify permissions.',
    'auth.authorizedAdminsOnly': 'Secure access · Authorized administrators only',
    'auth.continueWithApple': 'Continue with Apple',
    'auth.continueWithGoogle': 'Continue with Google',
    'auth.socialSetupRequired': 'Social sign in is being prepared. Once Apple and Google are configured, this option will become available.',
    'auth.appleChecking': 'Checking Apple account...',
    'auth.appleUnavailable': 'Sign in with Apple is not available on this device.',
    'auth.appleOnlyOnIOS': 'This option is only available on iPhone and iPad.',
    'auth.appleMissingToken': 'Apple did not return a valid authentication token.',
    'auth.appleCanceled': 'Apple sign in was canceled.',
    'profile.updatedName': 'Name updated successfully.',
    'profile.updateNameError': 'Unable to update name.',
    'profile.changedPassword': 'Password changed successfully.',
    'profile.changePasswordError': 'Unable to change password.',
    'profile.galleryPermission': 'Permission Required',
    'profile.galleryPermissionBody': 'We need access to your photo library.',
    'profile.avatarUploadWarning': 'Unable to upload the photo. Check storage configuration.',
    'profile.avatarUpdated': 'Profile photo updated.',
    'profile.avatarUpdateError': 'Unable to update profile photo.',
    'profile.galleryOpenError': 'Could not open the photo library.',
    'profile.logoutTitle': 'Sign Out',
    'profile.logoutBody': 'Are you sure you want to sign out?',
    'profile.logout': 'Sign out',
    'profile.newName': 'New name',
    'profile.deleteAccount': 'Delete account',
    'profile.deleteAccountTitle': 'Delete account permanently',
    'profile.deleteAccountBody': 'This action deletes your account, posts, comments, and notification tokens. It cannot be undone.',
    'profile.deleteAccountConfirm': 'Yes, delete account',
    'profile.deleteAccountSuccess': 'Your account was deleted successfully.',
    'profile.deleteAccountError': 'Unable to delete the account.',
    'profile.deleteAccountInProgress': 'Deleting account...',
    'profile.deleteAccountDataWarning': 'Associated data will be permanently removed.',
    'error.unknown': 'An unknown error occurred.',
    'error.invalidCredentials': 'Invalid credentials. Check your email and password.',
    'error.emailNotConfirmed': 'Your email has not been confirmed yet.',
    'error.userAlreadyRegistered': 'This email is already registered.',
    'error.validPasswordRequired': 'A valid password is required.',
    'error.invalidEmailFormat': 'Invalid email format.',
    'error.rateLimit': 'Too many attempts. Please wait a few minutes.',
    'error.securityWait': 'Please wait before trying again.',
    'error.securityWaitSeconds': 'Please wait {seconds} seconds before trying again.',
    'error.newPasswordDifferent': 'The new password must be different from the old one.',
    'error.authSessionMissing': 'Session expired. Please sign in again.',
    'error.jwtExpired': 'Session expired. Please sign in again.',
    'error.tokenExpired': 'Token expired or invalid.',
    'error.userNotFound': 'User not found.',
    'error.networkRequestFailed': 'Temporary connection issue. Please try again in a moment.',
    'error.permissionDenied': 'You do not have permission for this action.',
    'error.duplicateRecord': 'This record already exists.',
    'error.foreignKeyConstraint': 'Data reference error. Please try again.',
    'error.resourceNotFound': 'Resource not found on the server.',
    'error.serverRelationNotFound': 'Server table not found.',
  },
  es: {
    'common.error': 'Error',
    'common.success': 'Éxito',
    'common.ok': 'OK',
    'common.cancel': 'Cancelar',
    'common.continue': 'Continuar',
    'common.save': 'Guardar',
    'common.loading': 'Cargando...',
    'common.user': 'Usuario',
    'nav.back': 'Volver',
    'tabs.incidents': 'Incidencias',
    'tabs.operationStop': 'Op. Stop',
    'tabs.lostFound': 'Objetos perdidos',
    'tabs.anomalies': 'Anomalías',
    'tabs.profile': 'Perfil',
    'home.appName': 'Alerta Madeira',
    'auth.email': 'Correo electrónico',
    'auth.password': 'Contraseña',
    'auth.confirmPassword': 'Confirmar contraseña',
    'auth.newPassword': 'Nueva contraseña',
    'auth.username': 'Nombre de usuario',
    'auth.login': 'Iniciar sesión',
    'auth.register': 'Registrarse',
    'auth.createAccount': 'Crear cuenta',
    'auth.alreadyHaveAccount': '¿Ya tienes cuenta?',
    'auth.noAccount': '¿No tienes cuenta?',
    'auth.rememberMe': 'Recordar datos',
    'auth.forgotPassword': '¿Olvidaste tu contraseña?',
    'auth.adminAccess': 'Acceso de administración',
    'auth.privacyPolicy': 'Política de privacidad',
    'auth.contacts': 'Contactos',
    'auth.fillEmailPassword': 'Introduce tu correo y contraseña para continuar.',
    'auth.fillAllFields': 'Completa todos los campos.',
    'auth.passwordMismatch': 'Las contraseñas no coinciden.',
    'auth.passwordTooShort': 'La contraseña debe tener al menos 6 caracteres.',
    'auth.loginChecking': 'Validando acceso...',
    'auth.loginSuccess': 'Inicio de sesión correcto.',
    'auth.loginTemporarilyUnavailable': 'No pudimos completar el inicio de sesión ahora. Inténtalo de nuevo en un momento.',
    'auth.loginConnectionIssue': 'Problema temporal al comunicarse con el servicio de autenticación. Inténtalo de nuevo en un momento.',
    'auth.subtitle': 'Protege a la comunidad. Comparte alertas rápidamente.',
    'auth.registerSubtitle': 'Únete a la comunidad de Alerta Madeira',
    'auth.resetSubtitle': 'Define tu nueva contraseña',
    'auth.verifyCode': 'Verificar código',
    'auth.verifyCodeSubtitle': 'Introduce el código enviado a tu correo para verificar tu cuenta',
    'auth.verifyResetSubtitle': 'Introduce el código enviado a tu correo para restablecer tu contraseña',
    'auth.enterFullCode': 'Introduce el código completo de 6 dígitos.',
    'auth.emailVerified': 'Correo verificado',
    'auth.emailVerifiedSuccess': '¡Correo verificado correctamente! Bienvenido a Alerta Madeira.',
    'auth.codeSentTitle': 'Código enviado',
    'auth.codeSentBody': 'Se envió un nuevo código a tu correo.',
    'auth.resendCode': 'Reenviar código',
    'auth.sending': 'Enviando...',
    'auth.resendCodeIn': 'Reenviar código ({seconds}s)',
    'auth.verificationIncomplete': 'Verificación no completada.',
    'auth.passwordUpdated': '¡Contraseña actualizada correctamente!',
    'auth.enterNewPassword': 'Introduce la nueva contraseña.',
    'auth.forgotPasswordTitle': 'Recuperar contraseña',
    'auth.forgotPasswordSubtitle': 'Te enviaremos un código de verificación a tu correo.',
    'auth.sendCode': 'Enviar código',
    'auth.enterEmail': 'Introduce tu correo.',
    'auth.adminTitle': 'Administración',
    'auth.adminSubtitle': 'Alerta Madeira · Backoffice',
    'auth.adminLoginTitle': 'Acceso de administrador',
    'auth.adminLoginDescription': 'Solo las cuentas con permisos de administrador pueden acceder al panel.',
    'auth.adminChecking': 'Validando permisos de administrador...',
    'auth.adminConfirmed': 'Acceso de administrador confirmado.',
    'auth.adminEmail': 'Correo del administrador',
    'auth.adminNoPermission': 'Esta cuenta no tiene permisos de administrador.',
    'auth.adminPermissionCheckError': 'No se pudieron verificar los permisos.',
    'auth.authorizedAdminsOnly': 'Acceso seguro · Solo administradores autorizados',
    'auth.continueWithApple': 'Continuar con Apple',
    'auth.continueWithGoogle': 'Continuar con Google',
    'auth.socialSetupRequired': 'El inicio de sesión social se está preparando. Cuando Apple y Google estén configurados, esta opción estará disponible.',
    'auth.appleChecking': 'Validando cuenta de Apple...',
    'auth.appleUnavailable': 'Iniciar sesión con Apple no está disponible en este dispositivo.',
    'auth.appleOnlyOnIOS': 'Esta opción solo está disponible en iPhone y iPad.',
    'auth.appleMissingToken': 'Apple no devolvió un token de autenticación válido.',
    'auth.appleCanceled': 'El inicio de sesión con Apple fue cancelado.',
    'profile.updatedName': 'Nombre actualizado correctamente.',
    'profile.updateNameError': 'No se pudo actualizar el nombre.',
    'profile.changedPassword': 'Contraseña cambiada correctamente.',
    'profile.changePasswordError': 'No se pudo cambiar la contraseña.',
    'profile.galleryPermission': 'Permiso necesario',
    'profile.galleryPermissionBody': 'Necesitamos acceso a tu galería.',
    'profile.avatarUploadWarning': 'No se pudo subir la foto. Revisa la configuración del almacenamiento.',
    'profile.avatarUpdated': 'Foto de perfil actualizada.',
    'profile.avatarUpdateError': 'No se pudo actualizar la foto de perfil.',
    'profile.galleryOpenError': 'No se pudo abrir la galería.',
    'profile.logoutTitle': 'Cerrar sesión',
    'profile.logoutBody': '¿Seguro que quieres cerrar sesión?',
    'profile.logout': 'Salir',
    'profile.newName': 'Nuevo nombre',
    'profile.deleteAccount': 'Eliminar cuenta',
    'profile.deleteAccountTitle': 'Eliminar cuenta permanentemente',
    'profile.deleteAccountBody': 'Esta acción elimina tu cuenta, publicaciones, comentarios y tokens de notificaciones. No se puede deshacer.',
    'profile.deleteAccountConfirm': 'Sí, eliminar cuenta',
    'profile.deleteAccountSuccess': 'Tu cuenta se eliminó correctamente.',
    'profile.deleteAccountError': 'No se pudo eliminar la cuenta.',
    'profile.deleteAccountInProgress': 'Eliminando cuenta...',
    'profile.deleteAccountDataWarning': 'Los datos asociados se eliminarán permanentemente.',
    'error.unknown': 'Ocurrió un error desconocido.',
    'error.invalidCredentials': 'Credenciales inválidas. Verifica tu correo y contraseña.',
    'error.emailNotConfirmed': 'Tu correo aún no ha sido confirmado.',
    'error.userAlreadyRegistered': 'Este correo ya está registrado.',
    'error.validPasswordRequired': 'Se requiere una contraseña válida.',
    'error.invalidEmailFormat': 'Formato de correo inválido.',
    'error.rateLimit': 'Demasiados intentos. Espera unos minutos.',
    'error.securityWait': 'Espera antes de intentarlo de nuevo.',
    'error.securityWaitSeconds': 'Espera {seconds} segundos antes de intentarlo de nuevo.',
    'error.newPasswordDifferent': 'La nueva contraseña debe ser diferente a la anterior.',
    'error.authSessionMissing': 'La sesión expiró. Inicia sesión de nuevo.',
    'error.jwtExpired': 'La sesión expiró. Inicia sesión de nuevo.',
    'error.tokenExpired': 'Token expirado o inválido.',
    'error.userNotFound': 'Usuario no encontrado.',
    'error.networkRequestFailed': 'Problema temporal de conexión. Inténtalo de nuevo en un momento.',
    'error.permissionDenied': 'No tienes permiso para esta acción.',
    'error.duplicateRecord': 'Este registro ya existe.',
    'error.foreignKeyConstraint': 'Error de referencia de datos. Inténtalo de nuevo.',
    'error.resourceNotFound': 'Recurso no encontrado en el servidor.',
    'error.serverRelationNotFound': 'No se encontró la tabla del servidor.',
  },
  fr: {
    'common.error': 'Erreur',
    'common.success': 'Succès',
    'common.ok': 'OK',
    'common.cancel': 'Annuler',
    'common.continue': 'Continuer',
    'common.save': 'Enregistrer',
    'common.loading': 'Chargement...',
    'common.user': 'Utilisateur',
    'nav.back': 'Retour',
    'tabs.incidents': 'Incidents',
    'tabs.operationStop': 'Op. Stop',
    'tabs.lostFound': 'Objets trouvés',
    'tabs.anomalies': 'Anomalies',
    'tabs.profile': 'Profil',
    'home.appName': 'Alerta Madeira',
    'auth.email': 'E-mail',
    'auth.password': 'Mot de passe',
    'auth.confirmPassword': 'Confirmer le mot de passe',
    'auth.newPassword': 'Nouveau mot de passe',
    'auth.username': "Nom d'utilisateur",
    'auth.login': 'Se connecter',
    'auth.register': "S'inscrire",
    'auth.createAccount': 'Créer un compte',
    'auth.alreadyHaveAccount': 'Vous avez déjà un compte ?',
    'auth.noAccount': "Vous n'avez pas de compte ?",
    'auth.rememberMe': 'Mémoriser mes données',
    'auth.forgotPassword': 'Mot de passe oublié ?',
    'auth.adminAccess': 'Accès administrateur',
    'auth.privacyPolicy': 'Politique de confidentialité',
    'auth.contacts': 'Contacts',
    'auth.fillEmailPassword': 'Saisissez votre e-mail et votre mot de passe pour continuer.',
    'auth.fillAllFields': 'Veuillez remplir tous les champs.',
    'auth.passwordMismatch': 'Les mots de passe ne correspondent pas.',
    'auth.passwordTooShort': 'Le mot de passe doit contenir au moins 6 caractères.',
    'auth.loginChecking': 'Vérification en cours...',
    'auth.loginSuccess': 'Connexion réussie.',
    'auth.loginTemporarilyUnavailable': 'Impossible de finaliser la connexion maintenant. Réessayez dans un instant.',
    'auth.loginConnectionIssue': "Problème temporaire de communication avec le service d'authentification. Réessayez dans un instant.",
    'auth.subtitle': 'Protégez la communauté. Partagez vite les alertes.',
    'auth.registerSubtitle': 'Rejoignez la communauté Alerta Madeira',
    'auth.resetSubtitle': 'Définissez votre nouveau mot de passe',
    'auth.verifyCode': 'Vérifier le code',
    'auth.verifyCodeSubtitle': 'Saisissez le code envoyé par e-mail pour vérifier votre compte',
    'auth.verifyResetSubtitle': 'Saisissez le code envoyé par e-mail pour réinitialiser votre mot de passe',
    'auth.enterFullCode': 'Saisissez le code complet à 6 chiffres.',
    'auth.emailVerified': 'E-mail vérifié',
    'auth.emailVerifiedSuccess': 'E-mail vérifié avec succès ! Bienvenue sur Alerta Madeira.',
    'auth.codeSentTitle': 'Code envoyé',
    'auth.codeSentBody': 'Un nouveau code a été envoyé à votre e-mail.',
    'auth.resendCode': 'Renvoyer le code',
    'auth.sending': 'Envoi...',
    'auth.resendCodeIn': 'Renvoyer le code ({seconds}s)',
    'auth.verificationIncomplete': 'Vérification non terminée.',
    'auth.passwordUpdated': 'Mot de passe mis à jour avec succès !',
    'auth.enterNewPassword': 'Saisissez le nouveau mot de passe.',
    'auth.forgotPasswordTitle': 'Réinitialiser le mot de passe',
    'auth.forgotPasswordSubtitle': 'Nous enverrons un code de vérification à votre e-mail.',
    'auth.sendCode': 'Envoyer le code',
    'auth.enterEmail': 'Saisissez votre e-mail.',
    'auth.adminTitle': 'Administration',
    'auth.adminSubtitle': 'Alerta Madeira · Backoffice',
    'auth.adminLoginTitle': 'Connexion administrateur',
    'auth.adminLoginDescription': 'Seuls les comptes disposant des autorisations administrateur peuvent accéder au tableau de bord.',
    'auth.adminChecking': 'Vérification des autorisations administrateur...',
    'auth.adminConfirmed': 'Accès administrateur confirmé.',
    'auth.adminEmail': 'E-mail administrateur',
    'auth.adminNoPermission': 'Ce compte ne dispose pas des autorisations administrateur.',
    'auth.adminPermissionCheckError': 'Impossible de vérifier les autorisations.',
    'auth.authorizedAdminsOnly': 'Accès sécurisé · Administrateurs autorisés uniquement',
    'auth.continueWithApple': 'Continuer avec Apple',
    'auth.continueWithGoogle': 'Continuer avec Google',
    'auth.socialSetupRequired': 'La connexion sociale est en préparation. Une fois Apple et Google configurés, cette option sera disponible.',
    'auth.appleChecking': 'Vérification du compte Apple...',
    'auth.appleUnavailable': 'La connexion avec Apple n’est pas disponible sur cet appareil.',
    'auth.appleOnlyOnIOS': 'Cette option est disponible uniquement sur iPhone et iPad.',
    'auth.appleMissingToken': 'Apple n’a pas renvoyé de jeton d’authentification valide.',
    'auth.appleCanceled': 'La connexion avec Apple a été annulée.',
    'profile.updatedName': 'Nom mis à jour avec succès.',
    'profile.updateNameError': 'Impossible de mettre à jour le nom.',
    'profile.changedPassword': 'Mot de passe modifié avec succès.',
    'profile.changePasswordError': 'Impossible de modifier le mot de passe.',
    'profile.galleryPermission': 'Autorisation requise',
    'profile.galleryPermissionBody': 'Nous avons besoin de l’accès à votre galerie.',
    'profile.avatarUploadWarning': 'Impossible de téléverser la photo. Vérifiez la configuration du stockage.',
    'profile.avatarUpdated': 'Photo de profil mise à jour.',
    'profile.avatarUpdateError': 'Impossible de mettre à jour la photo de profil.',
    'profile.galleryOpenError': 'Impossible d’ouvrir la galerie.',
    'profile.logoutTitle': 'Se déconnecter',
    'profile.logoutBody': 'Voulez-vous vraiment vous déconnecter ?',
    'profile.logout': 'Déconnexion',
    'profile.newName': 'Nouveau nom',
    'profile.deleteAccount': 'Supprimer le compte',
    'profile.deleteAccountTitle': 'Supprimer le compte définitivement',
    'profile.deleteAccountBody': 'Cette action supprime votre compte, vos publications, vos commentaires et vos jetons de notification. Elle est irréversible.',
    'profile.deleteAccountConfirm': 'Oui, supprimer le compte',
    'profile.deleteAccountSuccess': 'Votre compte a été supprimé avec succès.',
    'profile.deleteAccountError': 'Impossible de supprimer le compte.',
    'profile.deleteAccountInProgress': 'Suppression du compte...',
    'profile.deleteAccountDataWarning': 'Les données associées seront supprimées définitivement.',
    'error.unknown': 'Une erreur inconnue est survenue.',
    'error.invalidCredentials': 'Identifiants invalides. Vérifiez votre e-mail et votre mot de passe.',
    'error.emailNotConfirmed': "Votre e-mail n'a pas encore été confirmé.",
    'error.userAlreadyRegistered': 'Cet e-mail est déjà enregistré.',
    'error.validPasswordRequired': 'Un mot de passe valide est requis.',
    'error.invalidEmailFormat': 'Format d’e-mail invalide.',
    'error.rateLimit': 'Trop de tentatives. Veuillez patienter quelques minutes.',
    'error.securityWait': 'Veuillez patienter avant de réessayer.',
    'error.securityWaitSeconds': 'Veuillez patienter {seconds} secondes avant de réessayer.',
    'error.newPasswordDifferent': 'Le nouveau mot de passe doit être différent de l’ancien.',
    'error.authSessionMissing': 'Session expirée. Veuillez vous reconnecter.',
    'error.jwtExpired': 'Session expirée. Veuillez vous reconnecter.',
    'error.tokenExpired': 'Jeton expiré ou invalide.',
    'error.userNotFound': 'Utilisateur introuvable.',
    'error.networkRequestFailed': 'Problème de connexion temporaire. Réessayez dans un instant.',
    'error.permissionDenied': 'Vous n’avez pas la permission pour cette action.',
    'error.duplicateRecord': 'Cet enregistrement existe déjà.',
    'error.foreignKeyConstraint': 'Erreur de référence des données. Réessayez.',
    'error.resourceNotFound': 'Ressource introuvable sur le serveur.',
    'error.serverRelationNotFound': 'Table serveur introuvable.',
  },
};

function resolveLocale(): string {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
    return navigator.language || 'pt-PT';
  }

  const iosLocale = NativeModules?.SettingsManager?.settings?.AppleLocale as string | undefined;
  const iosLanguages = NativeModules?.SettingsManager?.settings?.AppleLanguages as string[] | undefined;
  const androidLocale = NativeModules?.I18nManager?.localeIdentifier as string | undefined;

  return iosLocale || iosLanguages?.[0] || androidLocale || 'pt-PT';
}

export function getDeviceLanguage(): SupportedLanguage {
  const locale = resolveLocale().toLowerCase();
  if (locale.startsWith('en')) return 'en';
  if (locale.startsWith('es')) return 'es';
  if (locale.startsWith('fr')) return 'fr';
  return 'pt';
}

export function t(key: TranslationKey, params?: TranslationParams): string {
  const language = getDeviceLanguage();
  const template = translations[language][key] ?? translations.pt[key] ?? key;

  if (!params) {
    return template;
  }

  return Object.entries(params).reduce((result, [paramKey, value]) => {
    return result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(value));
  }, template);
}
