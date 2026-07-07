// Supabase Edge Function: send-email
// Sends a transactional email via Resend (contact form, junta reports, etc.)
//
// Required Supabase secrets:
//   supabase secrets set RESEND_API_KEY=re_xxx
//   supabase secrets set RESEND_FROM_EMAIL=Alerta Madeira <geral@alertamadeira.com>
//
// Deploy:
//   supabase functions deploy send-email --project-ref cefplgeamddmvshxbpbw

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, content-type, x-client-info, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface SendEmailRequest {
  to: string[];
  subject: string;
  message: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") ?? "Alerta Madeira <geral@alertamadeira.com>";
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

    if (!RESEND_API_KEY) {
      console.error("[send-email] Missing RESEND_API_KEY");
      return new Response(
        JSON.stringify({ error: "Servidor de email não configurado." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Require authentication
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Não autenticado." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Verify the user session
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: SUPABASE_ANON_KEY,
        },
      });

      if (!userResponse.ok) {
        return new Response(
          JSON.stringify({ error: "Sessão inválida." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const { to, subject, message }: SendEmailRequest = await req.json();

    if (!to || !Array.isArray(to) || to.length === 0 || !subject || !message) {
      return new Response(
        JSON.stringify({ error: "Destinatário, assunto e mensagem são obrigatórios." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:40px 20px;">
<tr><td align="center">
<table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <tr><td style="background:linear-gradient(135deg,#B71C1C 0%,#E53935 50%,#FF5722 100%);padding:32px;text-align:center;">
    <div style="width:56px;height:56px;border-radius:14px;background:rgba(255,255,255,0.2);margin:0 auto 12px;display:flex;align-items:center;justify-content:center;">
      <span style="font-size:28px;font-weight:900;color:#fff;line-height:56px;">AM</span>
    </div>
    <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800;">Alerta Madeira</h1>
  </td></tr>
  <tr><td style="padding:28px 24px;">
    <h2 style="color:#1a1a2e;margin:0 0 12px;font-size:18px;font-weight:700;">${subject}</h2>
    <p style="color:#444;font-size:15px;line-height:1.6;white-space:pre-wrap;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
  </td></tr>
  <tr><td style="background:#F9FAFB;padding:16px 24px;border-top:1px solid #f0f0f0;text-align:center;">
    <p style="margin:0;color:#9CA3AF;font-size:11px;">Enviado pela app Alerta Madeira · Madeira, Portugal</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

    const results: Array<{ email: string; success: boolean; error?: string }> = [];

    for (const recipient of to) {
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: RESEND_FROM_EMAIL,
            to: [recipient],
            subject: `🚨 ${subject}`,
            html: htmlContent,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          console.error("[send-email] Resend error for", recipient, ":", data?.message);
          results.push({ email: recipient, success: false, error: data?.message ?? "Send failed" });
        } else {
          console.log("[send-email] Sent to", recipient, "id:", data?.id);
          results.push({ email: recipient, success: true });
        }
      } catch (err: any) {
        console.error("[send-email] Exception for", recipient, ":", err.message);
        results.push({ email: recipient, success: false, error: err.message });
      }
    }

    const successCount = results.filter((r) => r.success).length;

    return new Response(
      JSON.stringify({
        success: successCount > 0,
        sent: successCount,
        total: results.length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[send-email] Exception:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
