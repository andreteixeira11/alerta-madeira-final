import { Resend } from "resend";
import * as z from "zod";

import { createTRPCRouter, publicProcedure } from "../create-context";

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.RESEND_FROM_EMAIL || "Alerta Madeira <geral@alertamadeira.com>";

const otpStore = new Map<string, { code: string; expiresAt: number }>();

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function cleanExpiredOtps() {
  const now = Date.now();
  for (const [key, value] of otpStore.entries()) {
    if (value.expiresAt < now) {
      otpStore.delete(key);
    }
  }
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
      cleanExpiredOtps();

      const code = generateOtp();
      const expiresAt = Date.now() + 10 * 60 * 1000;
      const storeKey = `${input.type}:${input.email.toLowerCase()}`;

      otpStore.set(storeKey, { code, expiresAt });

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
        return { success: true };
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
      }),
    )
    .mutation(async ({ input }) => {
      cleanExpiredOtps();

      const storeKey = `${input.type}:${input.email.toLowerCase()}`;
      const stored = otpStore.get(storeKey);

      if (!stored) {
        console.log("[OTP] No code found for", storeKey);
        throw new Error("Código expirado ou inválido. Solicite um novo código.");
      }

      if (stored.expiresAt < Date.now()) {
        otpStore.delete(storeKey);
        console.log("[OTP] Code expired for", storeKey);
        throw new Error("Código expirado. Solicite um novo código.");
      }

      if (stored.code !== input.code) {
        console.log("[OTP] Invalid code for", storeKey);
        throw new Error("Código incorreto. Tente novamente.");
      }

      if (input.type !== 'password_reset') {
        otpStore.delete(storeKey);
      }
      console.log("[OTP] Code verified for", storeKey);

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
        code: z.string().length(6),
        newPassword: z.string().min(6),
      }),
    )
    .mutation(async ({ input }) => {
      console.log("[ResetPassword] Attempting password reset for:", input.email);

      cleanExpiredOtps();
      const storeKey = `password_reset:${input.email.toLowerCase()}`;
      const stored = otpStore.get(storeKey);

      if (!stored) {
        console.log("[ResetPassword] No OTP found for", storeKey);
        throw new Error("Código expirado ou inválido. Solicite um novo código.");
      }

      if (stored.expiresAt < Date.now()) {
        otpStore.delete(storeKey);
        throw new Error("Código expirado. Solicite um novo código.");
      }

      if (stored.code !== input.code) {
        console.log("[ResetPassword] Invalid code for", storeKey);
        throw new Error("Código incorreto. Tente novamente.");
      }

      otpStore.delete(storeKey);
      console.log("[ResetPassword] OTP verified, updating password");

      const { createClient } = await import("@supabase/supabase-js");
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

      if (!serviceRoleKey) {
        console.log("[ResetPassword] SUPABASE_SERVICE_ROLE_KEY not set");
        throw new Error("Erro de configuração do servidor. Contacte o administrador.");
      }

      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });

      try {
        const { data: userData, error: listError } = await supabaseAdmin.auth.admin.listUsers();

        if (!listError && userData) {
          const user = userData.users?.find((u: any) => u.email === input.email);
          if (!user) {
            throw new Error("Utilizador não encontrado.");
          }

          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
            password: input.newPassword,
          });

          if (updateError) {
            console.log("[ResetPassword] Admin update error:", updateError.message);
            throw new Error("Erro ao atualizar palavra-passe.");
          }

          console.log("[ResetPassword] Password updated via admin API");
          return { success: true };
        }
      } catch (adminErr: any) {
        console.log("[ResetPassword] Admin API not available:", adminErr.message);
      }

      try {
        const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(input.email, {
          redirectTo: `${supabaseUrl}/auth/v1/callback`,
        });
        if (resetError) {
          console.log("[ResetPassword] Supabase reset email error:", resetError.message);
        }
      } catch (e: any) {
        console.log("[ResetPassword] Reset email exception:", e.message);
      }

      console.log("[ResetPassword] Falling back to signIn + updateUser");
      throw new Error(
        "Não foi possível redefinir a palavra-passe automaticamente. " +
        "Verifique o email enviado pelo sistema para concluir a redefinição."
      );
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
