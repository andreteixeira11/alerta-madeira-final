# Templates de Email — Alerta Madeira

Estes templates seguem o layout visual da app (cores, tipografia, icon "AM").
Cola cada template no **Supabase Dashboard → Authentication → Email Templates**.

## Cores da marca

| Cor | Hex |
|---|---|
| Primary (vermelho) | `#C0392B` |
| Primary Light | `#E74C3C` |
| Accent (laranja) | `#E67E22` |
| Text | `#1A1A2E` |
| Background | `#FDF2F0` |
| Border | `#F0E0E0` |
| Muted | `#9CA3AF` |

---

## 1. Confirm Signup (verificação de email)

**Assunto:** `Confirma o teu registo — Alerta Madeira`

```html
<!DOCTYPE html>
<html lang="pt">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#FDF2F0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FDF2F0;padding:40px 16px;">
<tr><td align="center">
<table width="100%" style="max-width:540px;background:#FFFFFF;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(192,57,43,0.10);">
  <tr><td style="background:linear-gradient(135deg,#C0392B 0%,#E74C3C 60%,#E67E22 100%);padding:36px 28px;text-align:center;">
    <div style="width:60px;height:60px;border-radius:16px;background:rgba(255,255,255,0.18);margin:0 auto 14px;line-height:60px;">
      <span style="font-size:26px;font-weight:900;color:#fff;letter-spacing:1px;">AM</span>
    </div>
    <h1 style="color:#fff;margin:0;font-size:21px;font-weight:800;letter-spacing:0.3px;">Alerta Madeira</h1>
    <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:12px;font-weight:500;letter-spacing:0.5px;text-transform:uppercase;">Madeira, Portugal</p>
  </td></tr>
  <tr><td style="padding:32px 28px 8px;">
    <h2 style="color:#1A1A2E;margin:0 0 12px;font-size:17px;font-weight:700;">Bem-vindo à comunidade!</h2>
    <p style="color:#444;font-size:14px;line-height:1.65;margin:0 0 20px;">Obrigado por te registares no Alerta Madeira. Usa o código abaixo para confirmar o teu email e ativar a tua conta.</p>
    <div style="text-align:center;margin:24px 0;">
      <div style="display:inline-block;background:#FDF2F0;border:2px solid #F0E0E0;border-radius:14px;padding:18px 36px;">
        <span style="font-size:32px;font-weight:800;color:#C0392B;letter-spacing:8px;">{{ .Token }}</span>
      </div>
    </div>
    <p style="color:#9CA3AF;font-size:12px;line-height:1.5;text-align:center;margin:0 0 8px;">Se não fizeste este registo, podes ignorar este email em segurança.</p>
  </td></tr>
  <tr><td style="padding:8px 28px 28px;">
    <div style="height:1px;background:#F0E0E0;margin:0 0 20px;"></div>
    <p style="margin:0;color:#9CA3AF;font-size:11px;line-height:1.5;text-align:center;">Alerta Madeira &middot; Madeira, Portugal &middot; alertamadeira.com</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>
```

---

## 2. Reset Password (recuperar password)

**Assunto:** `Recupera a tua palavra-passe — Alerta Madeira`

```html
<!DOCTYPE html>
<html lang="pt">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#FDF2F0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FDF2F0;padding:40px 16px;">
<tr><td align="center">
<table width="100%" style="max-width:540px;background:#FFFFFF;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(192,57,43,0.10);">
  <tr><td style="background:linear-gradient(135deg,#C0392B 0%,#E74C3C 60%,#E67E22 100%);padding:36px 28px;text-align:center;">
    <div style="width:60px;height:60px;border-radius:16px;background:rgba(255,255,255,0.18);margin:0 auto 14px;line-height:60px;">
      <span style="font-size:26px;font-weight:900;color:#fff;letter-spacing:1px;">AM</span>
    </div>
    <h1 style="color:#fff;margin:0;font-size:21px;font-weight:800;letter-spacing:0.3px;">Alerta Madeira</h1>
    <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:12px;font-weight:500;letter-spacing:0.5px;text-transform:uppercase;">Madeira, Portugal</p>
  </td></tr>
  <tr><td style="padding:32px 28px 8px;">
    <h2 style="color:#1A1A2E;margin:0 0 12px;font-size:17px;font-weight:700;">Recuperar palavra-passe</h2>
    <p style="color:#444;font-size:14px;line-height:1.65;margin:0 0 20px;">Recebemos um pedido para redefinir a tua palavra-passe. Usa o código abaixo para continuar.</p>
    <div style="text-align:center;margin:24px 0;">
      <div style="display:inline-block;background:#FDF2F0;border:2px solid #F0E0E0;border-radius:14px;padding:18px 36px;">
        <span style="font-size:32px;font-weight:800;color:#C0392B;letter-spacing:8px;">{{ .Token }}</span>
      </div>
    </div>
    <p style="color:#9CA3AF;font-size:12px;line-height:1.5;text-align:center;margin:0 0 8px;">Se não pediste esta alteração, ignora este email. A tua palavra-passe não será alterada.</p>
  </td></tr>
  <tr><td style="padding:8px 28px 28px;">
    <div style="height:1px;background:#F0E0E0;margin:0 0 20px;"></div>
    <p style="margin:0;color:#9CA3AF;font-size:11px;line-height:1.5;text-align:center;">Alerta Madeira &middot; Madeira, Portugal &middot; alertamadeira.com</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>
```

---

## 3. Magic Link (se usares login por link)

**Assunto:** `O teu link de acesso — Alerta Madeira`

```html
<!DOCTYPE html>
<html lang="pt">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#FDF2F0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FDF2F0;padding:40px 16px;">
<tr><td align="center">
<table width="100%" style="max-width:540px;background:#FFFFFF;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(192,57,43,0.10);">
  <tr><td style="background:linear-gradient(135deg,#C0392B 0%,#E74C3C 60%,#E67E22 100%);padding:36px 28px;text-align:center;">
    <div style="width:60px;height:60px;border-radius:16px;background:rgba(255,255,255,0.18);margin:0 auto 14px;line-height:60px;">
      <span style="font-size:26px;font-weight:900;color:#fff;letter-spacing:1px;">AM</span>
    </div>
    <h1 style="color:#fff;margin:0;font-size:21px;font-weight:800;letter-spacing:0.3px;">Alerta Madeira</h1>
    <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:12px;font-weight:500;letter-spacing:0.5px;text-transform:uppercase;">Madeira, Portugal</p>
  </td></tr>
  <tr><td style="padding:32px 28px 8px;text-align:center;">
    <h2 style="color:#1A1A2E;margin:0 0 12px;font-size:17px;font-weight:700;">O teu link de acesso</h2>
    <p style="color:#444;font-size:14px;line-height:1.65;margin:0 0 24px;">Clica no botão abaixo para entrares na tua conta.</p>
    <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#C0392B;color:#fff;text-decoration:none;font-size:15px;font-weight:700;padding:15px 40px;border-radius:14px;letter-spacing:0.3px;">Entrar na conta</a>
    <p style="color:#9CA3AF;font-size:12px;line-height:1.5;text-align:center;margin:24px 0 0;">Se não pediste este link, ignora este email.</p>
  </td></tr>
  <tr><td style="padding:8px 28px 28px;">
    <div style="height:1px;background:#F0E0E0;margin:0 0 20px;"></div>
    <p style="margin:0;color:#9CA3AF;font-size:11px;line-height:1.5;text-align:center;">Alerta Madeira &middot; Madeira, Portugal &middot; alertamadeira.com</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>
```

---

## 4. Change Email (alteração de email)

**Assunto:** `Confirma o teu novo email — Alerta Madeira`

```html
<!DOCTYPE html>
<html lang="pt">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#FDF2F0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FDF2F0;padding:40px 16px;">
<tr><td align="center">
<table width="100%" style="max-width:540px;background:#FFFFFF;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(192,57,43,0.10);">
  <tr><td style="background:linear-gradient(135deg,#C0392B 0%,#E74C3C 60%,#E67E22 100%);padding:36px 28px;text-align:center;">
    <div style="width:60px;height:60px;border-radius:16px;background:rgba(255,255,255,0.18);margin:0 auto 14px;line-height:60px;">
      <span style="font-size:26px;font-weight:900;color:#fff;letter-spacing:1px;">AM</span>
    </div>
    <h1 style="color:#fff;margin:0;font-size:21px;font-weight:800;letter-spacing:0.3px;">Alerta Madeira</h1>
    <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:12px;font-weight:500;letter-spacing:0.5px;text-transform:uppercase;">Madeira, Portugal</p>
  </td></tr>
  <tr><td style="padding:32px 28px 8px;">
    <h2 style="color:#1A1A2E;margin:0 0 12px;font-size:17px;font-weight:700;">Confirma o teu novo email</h2>
    <p style="color:#444;font-size:14px;line-height:1.65;margin:0 0 20px;">Pediste para alterar o email da tua conta. Usa o código abaixo para confirmar.</p>
    <div style="text-align:center;margin:24px 0;">
      <div style="display:inline-block;background:#FDF2F0;border:2px solid #F0E0E0;border-radius:14px;padding:18px 36px;">
        <span style="font-size:32px;font-weight:800;color:#C0392B;letter-spacing:8px;">{{ .Token }}</span>
      </div>
    </div>
    <p style="color:#9CA3AF;font-size:12px;line-height:1.5;text-align:center;margin:0 0 8px;">Se não pediste esta alteração, ignora este email.</p>
  </td></tr>
  <tr><td style="padding:8px 28px 28px;">
    <div style="height:1px;background:#F0E0E0;margin:0 0 20px;"></div>
    <p style="margin:0;color:#9CA3AF;font-size:11px;line-height:1.5;text-align:center;">Alerta Madeira &middot; Madeira, Portugal &middot; alertamadeira.com</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>
```

---

## 5. Invite User (convite de admin)

**Assunto:** `Convite para o Alerta Madeira`

```html
<!DOCTYPE html>
<html lang="pt">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#FDF2F0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FDF2F0;padding:40px 16px;">
<tr><td align="center">
<table width="100%" style="max-width:540px;background:#FFFFFF;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(192,57,43,0.10);">
  <tr><td style="background:linear-gradient(135deg,#C0392B 0%,#E74C3C 60%,#E67E22 100%);padding:36px 28px;text-align:center;">
    <div style="width:60px;height:60px;border-radius:16px;background:rgba(255,255,255,0.18);margin:0 auto 14px;line-height:60px;">
      <span style="font-size:26px;font-weight:900;color:#fff;letter-spacing:1px;">AM</span>
    </div>
    <h1 style="color:#fff;margin:0;font-size:21px;font-weight:800;letter-spacing:0.3px;">Alerta Madeira</h1>
    <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:12px;font-weight:500;letter-spacing:0.5px;text-transform:uppercase;">Madeira, Portugal</p>
  </td></tr>
  <tr><td style="padding:32px 28px 8px;text-align:center;">
    <h2 style="color:#1A1A2E;margin:0 0 12px;font-size:17px;font-weight:700;">Foste convidado!</h2>
    <p style="color:#444;font-size:14px;line-height:1.65;margin:0 0 24px;">Recebeste um convite para te juntares ao Alerta Madeira. Clica no botão para aceitar e definir a tua palavra-passe.</p>
    <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#C0392B;color:#fff;text-decoration:none;font-size:15px;font-weight:700;padding:15px 40px;border-radius:14px;letter-spacing:0.3px;">Aceitar convite</a>
  </td></tr>
  <tr><td style="padding:8px 28px 28px;">
    <div style="height:1px;background:#F0E0E0;margin:0 0 20px;"></div>
    <p style="margin:0;color:#9CA3AF;font-size:11px;line-height:1.5;text-align:center;">Alerta Madeira &middot; Madeira, Portugal &middot; alertamadeira.com</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>
```

---

## Instruções

1. Vai a **Supabase Dashboard** → **Authentication** → **Email Templates**
2. Para cada tipo de email (Confirm Signup, Reset Password, etc.):
   - Cola o **Assunto** correspondente no campo "Subject"
   - Cola o **HTML** na caixa "Email body" (substitui o template default)
3. Clica em **Save**
4. Testa fazendo um registo novo ou reset de password

> **Nota:** O template `send-email` (formulário de contacto / reportes) já foi atualizado no código da Edge Function e será aplicado no próximo deploy.
