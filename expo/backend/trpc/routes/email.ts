import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import * as z from "zod";

import { createTRPCRouter, publicProcedure } from "../create-context";

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.RESEND_FROM_EMAIL || "Alerta Madeira <geral@alertamadeira.com>";

const SUPABASE_URL = (process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? "") || "https://cefplgeamddmvshxbpbw.supabase.co";

// ---------------------------------------------------------------------------
// Fully stateless token system (no in-memory store — survives Worker cold
// starts and cross-instance routing in Cloudflare Workers)
// ---------------------------------------------------------------------------
const VERIFICATION_TOKEN_TTL_MS = 10 * 60 * 1000; // 10 min — matches OTP lifetime
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;        // 15 min — reset window

function base64UrlEncode(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(str: string): ArrayBuffer {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return Uint8Array.from(atob(str), (c) => c.charCodeAt(0)).buffer;
}

function getSecretKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
}

async function importHmacKey(usage: "sign" | "verify"): Promise<CryptoKey> {
  const secret = getSecretKey();
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    [usage],
  );
}

async function signPayload(payload: string): Promise<string> {
  const key = await importHmacKey("sign");
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return base64UrlEncode(sig);
}

async function verifySignature(payload: string, sigB64: string): Promise<boolean> {
  try {
    const key = await importHmacKey("verify");
    const sig = base64UrlDecode(sigB64);
    return crypto.subtle.verify("HMAC", key, sig, new TextEncoder().encode(payload));
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Verification token: {email}:{otp}:{type}:{expiresAt}  →  sig.payload
// Signed with SUPABASE_SERVICE_ROLE_KEY so it survives across Worker instances.
// ---------------------------------------------------------------------------
async function createVerificationToken(
  email: string,
  otp: string,
  type: "email_verification" | "password_reset",
): Promise<string> {
  const expiresAt = Date.now() + VERIFICATION_TOKEN_TTL_MS;
  const payload = `${email.toLowerCase()}:${otp}:${type}:${expiresAt}`;
  const sig = await signPayload(payload);
  return `${sig}.${btoa(payload)}`;
}

function parseVerificationToken(token: string): {
  email: string;
  otp: string;
  type: "email_verification" | "password_reset";
  expiresAt: number;
  sig: string;
} | null {
  try {
    const dotIdx = token.indexOf(".");
    if (dotIdx === -1) return null;
    const sig = token.slice(0, dotIdx);
    const payloadB64 = token.slice(dotIdx + 1);
    const payload = atob(payloadB64);
    const parts = payload.split(":");
    if (parts.length !== 4) return null;
    const [email, otp, type, expiresAtStr] = parts;
    const expiresAt = parseInt(expiresAtStr, 10);
    if (!expiresAt || !email || !otp || (type !== "email_verification" && type !== "password_reset")) {
      return null;
    }
    return { email, otp, type: type as "email_verification" | "password_reset", expiresAt, sig };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Reset token (separate, longer-lived): {email}:{expiresAt}  →  sig.expiresAt
// ---------------------------------------------------------------------------
async function createResetToken(email: string): Promise<string> {
  const expiresAt = Date.now() + RESET_TOKEN_TTL_MS;
  const payload = `${email.toLowerCase()}:${expiresAt}`;
  const sig = await signPayload(payload);
  return `${sig}.${expiresAt}`;
}

async function verifyResetToken(email: string, token: string): Promise<boolean> {
  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [sigB64, expiresAtStr] = parts;
  const expiresAt = parseInt(expiresAtStr, 10);
  if (!expiresAt || Date.now() > expiresAt) return false;

  const payload = `${email.toLowerCase()}:${expiresAt}`;
  return verifySignature(payload, sigB64);
}

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const emailRouter = createTRPCRouter({
  sendVerificationCode: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        type: z.enum(["email_verification", "password_reset"]),
      }),
    )
    .mutation(async ({ input }) => {
      const code = generateOtp();

      // Create a stateless signed token so verifyCode works across Worker instances
      const verificationToken = await createVerificationToken(input.email, code, input.type);

      console.log("[OTP] Generated code for", input.email, "type:", input.type);

      const isPasswordReset = input.type === "password_reset";
      const title = isPasswordReset ? "Redefinir Palavra-passe" : "Verificar Email";
      const message = isPasswordReset
        ? "Utilize o código abaixo para redefinir a sua palavra-passe."
        : "Utilize o código abaixo para verificar o seu email.";

      const isWelcome = !isPasswordReset;
      const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:40px 20px;">
<tr><td align="center">
<table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <tr><td style="background:linear-gradient(135deg,#B71C1C 0%,#E53935 50%,#FF5722 100%);padding:40px 32px;text-align:center;">
    <div style="width:64px;height:64px;border-radius:16px;background:rgba(255,255,255,0.2);margin:0 auto 14px;display:flex;align-items:center;justify-content:center;">
      <span style="font-size:32px;font-weight:900;color:#fff;line-height:64px;">AM</span>
    </div>
    <h1 style="color:#fff;margin:0;font-size:26px;font-weight:800;letter-spacing:-0.5px;">Alerta Madeira</h1>
    <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:13px;">Comunidade de Alerta da Madeira</p>
  </td></tr>
  <tr><td style="padding:36px 32px 28px;">
    <h2 style="color:#1a1a2e;margin:0 0 8px;font-size:22px;font-weight:700;text-align:center;">${title}</h2>
    <p style="color:#6b7280;font-size:15px;line-height:1.6;text-align:center;margin:0 0 28px;">${message}</p>
    <div style="background:linear-gradient(135deg,#FFF5F5 0%,#FEE2E2 100%);border:2px solid #FECACA;border-radius:14px;padding:24px;text-align:center;margin:0 0 24px;">
      <p style="margin:0 0 8px;font-size:12px;color:#9CA3AF;text-transform:uppercase;letter-spacing:2px;font-weight:600;">O seu código</p>
      <span style="font-size:38px;font-weight:800;color:#C0392B;letter-spacing:10px;font-family:'Courier New',monospace;">${code}</span>
    </div>
    <div style="background:#F9FAFB;border-radius:10px;padding:14px 18px;text-align:center;">
      <p style="margin:0;color:#9CA3AF;font-size:13px;">⏱ Este código expira em <strong style="color:#6b7280;">10 minutos</strong></p>
    </div>
    ${isWelcome ? '<div style="margin-top:28px;padding-top:24px;border-top:1px solid #f0f0f0;text-align:center;"><p style="color:#374151;font-size:15px;line-height:1.6;margin:0;">Bem-vindo à comunidade <strong>Alerta Madeira</strong>! 🏝️</p><p style="color:#6b7280;font-size:14px;line-height:1.5;margin:10px 0 0;">Partilhe ocorrências, alertas e ajude a manter a Madeira informada e segura.</p></div>' : ''}
  </td></tr>
  <tr><td style="background:#F9FAFB;padding:20px 32px;border-top:1px solid #f0f0f0;text-align:center;">
    <p style="margin:0;color:#9CA3AF;font-size:11px;">Alerta Madeira · Região Autónoma da Madeira, Portugal</p>
    <p style="margin:6px 0 0;color:#D1D5DB;font-size:10px;">Se não solicitou este código, ignore este email.</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>
      `;

      try {
        const { data, error } = await resend.emails.send({
          from: fromEmail,
          to: [input.email],
          subject: `🚨 ${title} - Código: ${code}`,
          html: htmlContent,
        });

        if (error) {
          console.log("[OTP] Email send error:", error.message);
          throw new Error("Erro ao enviar email com código");
        }

        console.log("[OTP] Email sent, id:", data?.id);
        return { success: true, verificationToken };
      } catch (err: any) {
        console.log("[OTP] Exception:", err.message);
        throw new Error(err.message || "Erro ao enviar email");
      }
    }),

  verifyCode: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        code: z.string().length(6),
        type: z.enum(["email_verification", "password_reset"]),
        verificationToken: z.string().min(10),
      }),
    )
    .mutation(async ({ input }) => {
      console.log("[OTP] Verifying code for", input.email, "type:", input.type);

      // Validate the stateless verification token
      const parsed = parseVerificationToken(input.verificationToken);
      if (!parsed) {
        console.log("[OTP] Invalid verification token format");
        throw new Error("Código expirado ou inválido. Solicite um novo código.");
      }

      if (parsed.email !== input.email.toLowerCase()) {
        console.log("[OTP] Token email mismatch");
        throw new Error("Código expirado ou inválido. Solicite um novo código.");
      }

      if (parsed.type !== input.type) {
        console.log("[OTP] Token type mismatch");
        throw new Error("Código expirado ou inválido. Solicite um novo código.");
      }

      if (Date.now() > parsed.expiresAt) {
        console.log("[OTP] Verification token expired for", input.email);
        throw new Error("Código expirado. Solicite um novo código.");
      }

      // Verify HMAC signature
      const dotIdx = input.verificationToken.indexOf(".");
      const payloadB64 = input.verificationToken.slice(dotIdx + 1);
      const payload = atob(payloadB64);
      const valid = await verifySignature(payload, parsed.sig);
      if (!valid) {
        console.log("[OTP] Invalid signature for", input.email);
        throw new Error("Código expirado ou inválido. Solicite um novo código.");
      }

      // Check OTP
      if (parsed.otp !== input.code) {
        console.log("[OTP] Invalid code for", input.email);
        throw new Error("Código incorreto. Tente novamente.");
      }

      if (input.type === "password_reset") {
        const resetToken = await createResetToken(input.email);
        console.log("[OTP] Code verified for", input.email, "- reset token created");
        return { success: true, verified: true, resetToken };
      }

      console.log("[OTP] Code verified for", input.email);
      return { success: true, verified: true };
    }),

  sendNotification: publicProcedure
    .input(
      z.object({
        to: z.array(z.string().email()),
        subject: z.string().min(1),
        message: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      console.log("[Email] Sending notification to:", input.to.length, "recipients");

      const htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #B71C1C 0%, #E53935 50%, #FF5722 100%); border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 24px;">
            <div style="width:64px;height:64px;border-radius:16px;background:rgba(255,255,255,0.2);margin:0 auto 14px;display:flex;align-items:center;justify-content:center;">
              <span style="font-size:32px;font-weight:900;color:#fff;line-height:64px;">AM</span>
            </div>
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 800;">Alerta Madeira</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 13px;">Comunidade de Alerta da Madeira</p>
          </div>
          <div style="background: #ffffff; border: 1px solid #e0e0e0; border-radius: 12px; padding: 24px;">
            <h2 style="color: #1a1a1a; margin-top: 0;">${input.subject}</h2>
            <p style="color: #444; font-size: 16px; line-height: 1.6;">${input.message.replace(/\n/g, "<br/>")}</p>
          </div>
          <p style="text-align: center; color: #999; font-size: 12px; margin-top: 24px;">
            Enviado pela app Alerta Madeira · Madeira, Portugal
          </p>
        </div>
      `;

      const results = [];
      const batchSize = 50;

      for (let i = 0; i < input.to.length; i += batchSize) {
        const batch = input.to.slice(i, i + batchSize);

        for (const recipient of batch) {
          try {
            const { data, error } = await resend.emails.send({
              from: fromEmail,
              to: [recipient],
              subject: `🚨 ${input.subject}`,
              html: htmlContent,
            });

            if (error) {
              console.log("[Email] Error sending to", recipient, ":", error.message);
              results.push({ email: recipient, success: false, error: error.message });
            } else {
              console.log("[Email] Sent to", recipient, "id:", data?.id);
              results.push({ email: recipient, success: true, id: data?.id });
            }
          } catch (err: any) {
            console.log("[Email] Exception sending to", recipient, ":", err.message);
            results.push({ email: recipient, success: false, error: err.message });
          }
        }
      }

      const successCount = results.filter((r) => r.success).length;
      console.log("[Email] Done. Success:", successCount, "/", results.length);

      return {
        sent: successCount,
        total: results.length,
        results,
      };
    }),

  resetPassword: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        resetToken: z.string().min(20),
        newPassword: z.string().min(6),
      }),
    )
    .mutation(async ({ input }) => {
      console.log("[ResetPassword] Attempting password reset for:", input.email);

      // Validate stateless token (no in-memory store needed)
      const valid = await verifyResetToken(input.email, input.resetToken);
      if (!valid) {
        console.log("[ResetPassword] Invalid or expired reset token for", input.email);
        throw new Error("Código expirado ou inválido. Solicite um novo código.");
      }

      console.log("[ResetPassword] Reset token verified, updating password");

      const supabaseUrl = SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? '';

      if (!serviceRoleKey) {
        console.log("[ResetPassword] Missing SUPABASE_SERVICE_ROLE_KEY");
        throw new Error("Erro de configuração do servidor. Contacte o administrador.");
      }

      console.log("[ResetPassword] Using Supabase URL:", supabaseUrl);

      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });

      // Use GoTrue admin REST API directly with email filter for reliable user lookup.
      // listUsers() paginates and may miss users beyond the first page.
      let userId: string | null = null;

      try {
        const filterParam = encodeURIComponent(`email=eq.${input.email.toLowerCase()}`);
        const adminUrl = `${supabaseUrl}/auth/v1/admin/users?filter=${filterParam}`;

        console.log("[ResetPassword] Looking up user via admin API");

        const userResponse = await fetch(adminUrl, {
          headers: {
            Authorization: `Bearer ${serviceRoleKey}`,
            apikey: serviceRoleKey,
          },
        });

        if (userResponse.ok) {
          const users: Array<{ id: string; email: string }> = await userResponse.json();
          const foundUser = users.find(
            (u) => u.email?.toLowerCase() === input.email.toLowerCase()
          );

          if (foundUser) {
            userId = foundUser.id;
            console.log("[ResetPassword] User found via admin REST API:", userId);
          } else {
            console.log("[ResetPassword] No user found with email:", input.email);
            throw new Error("Utilizador não encontrado. Verifique o email e tente novamente.");
          }
        } else {
          console.log("[ResetPassword] Admin REST API returned status:", userResponse.status);
        }
      } catch (restErr: any) {
        console.log("[ResetPassword] Admin REST API error:", restErr.message);
        // Fall through to listUsers as fallback
      }

      // Fallback: try listUsers if REST API didn't return a user
      if (!userId) {
        try {
          console.log("[ResetPassword] Falling back to listUsers");
          let page = 1;
          let found = false;

          while (!found && page <= 10) {
            const { data: userData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
              page,
              perPage: 200,
            });

            if (listError || !userData) {
              console.log("[ResetPassword] listUsers page", page, "error:", listError?.message);
              break;
            }

            const user = userData.users?.find(
              (u: any) => u.email?.toLowerCase() === input.email.toLowerCase()
            );

            if (user) {
              userId = user.id;
              found = true;
              console.log("[ResetPassword] User found via listUsers page", page);
            } else if ((userData.users?.length ?? 0) < 200) {
              // No more pages
              break;
            } else {
              page++;
            }
          }
        } catch (listErr: any) {
          console.log("[ResetPassword] listUsers fallback error:", listErr.message);
        }
      }

      if (!userId) {
        throw new Error(
          "Utilizador não encontrado. Verifique o email e tente novamente."
        );
      }

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: input.newPassword,
      });

      if (updateError) {
        console.log("[ResetPassword] Admin update error:", updateError.message);
        throw new Error("Erro ao atualizar palavra-passe. Tente novamente.");
      }

      console.log("[ResetPassword] Password updated successfully for user:", userId);
      return { success: true };
    }),

  sendBulkNotification: publicProcedure
    .input(
      z.object({
        subject: z.string().min(1),
        message: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      console.log("[Email] Sending bulk notification:", input.subject);

      const htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #B71C1C 0%, #E53935 50%, #FF5722 100%); border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 24px;">
            <div style="width:64px;height:64px;border-radius:16px;background:rgba(255,255,255,0.2);margin:0 auto 14px;display:flex;align-items:center;justify-content:center;">
              <span style="font-size:32px;font-weight:900;color:#fff;line-height:64px;">AM</span>
            </div>
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 800;">Alerta Madeira</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 13px;">Comunidade de Alerta da Madeira</p>
          </div>
          <div style="background: #ffffff; border: 1px solid #e0e0e0; border-radius: 12px; padding: 24px;">
            <h2 style="color: #1a1a1a; margin-top: 0;">${input.subject}</h2>
            <p style="color: #444; font-size: 16px; line-height: 1.6;">${input.message.replace(/\n/g, "<br/>")}</p>
          </div>
          <p style="text-align: center; color: #999; font-size: 12px; margin-top: 24px;">
            Enviado pela app Alerta Madeira · Madeira, Portugal
          </p>
        </div>
      `;

      try {
        const { data, error } = await resend.emails.send({
          from: fromEmail,
          to: [fromEmail.match(/<(.+)>/)?.[1] || "onboarding@resend.dev"],
          subject: `🚨 ${input.subject}`,
          html: htmlContent,
        });

        if (error) {
          console.log("[Email] Bulk send error:", error.message);
          throw new Error(error.message);
        }

        console.log("[Email] Bulk notification sent, id:", data?.id);
        return { success: true, id: data?.id };
      } catch (err: any) {
        console.log("[Email] Bulk exception:", err.message);
        throw new Error(err.message);
      }
    }),
});
