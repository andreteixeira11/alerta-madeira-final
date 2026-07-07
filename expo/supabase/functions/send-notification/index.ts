// Supabase Edge Function: send-notification
// Sends a push notification to all OneSignal subscribers and logs it.
//
// Required Supabase secrets (set via dashboard or CLI):
//   supabase secrets set ONESIGNAL_APP_ID=7ee2c5b5-00f8-4c43-88e6-cabc710eb592
//   supabase secrets set ONESIGNAL_REST_API_KEY=<your-rest-api-key>
//
// SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY are provided
// automatically by the Supabase edge function runtime.
//
// Deploy:
//   supabase functions deploy send-notification --project-ref cefplgeamddmvshxbpbw

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, content-type, x-client-info, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface NotificationRequest {
  title: string;
  body: string;
  url?: string;
  sentBy?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
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
    const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID");
    const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      console.error("[send-notification] Missing OneSignal credentials");
      return new Response(
        JSON.stringify({ error: "OneSignal não configurado no servidor." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[send-notification] Missing Supabase credentials");
      return new Response(
        JSON.stringify({ error: "Supabase não configurado no servidor." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Extract JWT from Authorization header
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Não autenticado." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Verify the user and check admin role
    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Sessão inválida." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Check if the user is an admin
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: profile, error: profileError } = await adminClient
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Acesso negado. Apenas administradores." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Parse request body
    const { title, body, url, sentBy }: NotificationRequest = await req.json();

    if (!title || !body) {
      return new Response(
        JSON.stringify({ error: "Título e corpo são obrigatórios." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Send via OneSignal REST API to all subscribers
    const payload: Record<string, unknown> = {
      app_id: ONESIGNAL_APP_ID,
      included_segments: ["All"],
      headings: { en: title, pt: title },
      contents: { en: body, pt: body },
    };

    if (url) {
      payload.url = url;
      payload.web_url = url;
    }

    console.log("[send-notification] Sending to OneSignal:", title);

    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (result.errors && result.errors.length > 0) {
      console.error("[send-notification] OneSignal errors:", result.errors);
      return new Response(
        JSON.stringify({ error: result.errors.join(", ") }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const recipients = result.recipients ?? 0;
    console.log("[send-notification] Sent to", recipients, "recipients, id:", result.id);

    // Log to admin_notifications table
    const { error: logError } = await adminClient
      .from("admin_notifications")
      .insert({
        title,
        body,
        link_url: url || null,
        sent_by: sentBy || user.id,
        recipients_count: recipients,
      });

    if (logError) {
      console.error("[send-notification] Log error:", logError.message);
    }

    return new Response(
      JSON.stringify({
        success: true,
        recipients,
        id: result.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[send-notification] Exception:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
