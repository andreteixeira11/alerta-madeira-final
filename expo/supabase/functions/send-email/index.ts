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
        JSON.stringify({ error: "Servidor de email nao configurado." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Require authentication
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Nao autenticado." }),
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
          JSON.stringify({ error: "Sessao invalida." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const { to, subject, message }: SendEmailRequest = await req.json();

    if (!to || !Array.isArray(to) || to.length === 0 || !subject || !message) {
      return new Response(
        JSON.stringify({ error: "Destinatario, assunto e mensagem sao obrigatorios." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const escapedMessage = message.replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const htmlContent = `
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
    <h2 style="color:#1A1A2E;margin:0 0 16px;font-size:17px;font-weight:700;">${subject}</h2>
    <p style="color:#444;font-size:14px;line-height:1.65;white-space:pre-wrap;margin:0;">${escapedMessage}</p>
  </td></tr>
  <tr><td style="padding:8px 28px 28px;">
    <div style="height:1px;background:#F0E0E0;margin:0 0 20px;"></div>
    <p style="margin:0;color:#9CA3AF;font-size:11px;line-height:1.5;text-align:center;">Este email foi enviado através da app Alerta Madeira.<br>Madeira, Portugal &middot; alertamadeira.com</p>
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

export {};
