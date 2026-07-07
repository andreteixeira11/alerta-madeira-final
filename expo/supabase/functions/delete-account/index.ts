// Supabase Edge Function: delete-account
// Permanently deletes the authenticated user's account and all associated data.
//
// Required Supabase secrets (auto-provided):
//   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
//
// Deploy:
//   supabase functions deploy delete-account --project-ref cefplgeamddmvshxbpbw

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, content-type, x-client-info, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[delete-account] Missing Supabase credentials");
      return new Response(
        JSON.stringify({ error: "Servidor não configurado." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Não autenticado." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Verify the user with their access token
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

    const userId = user.id;
    console.log("[delete-account] Deleting account for user:", userId);

    // Admin client with service role key
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Delete associated data
    const { error: commentsErr } = await adminClient.from("comments").delete().eq("user_id", userId);
    if (commentsErr) console.log("[delete-account] Comments delete error:", commentsErr.message);

    const { error: postsErr } = await adminClient.from("posts").delete().eq("user_id", userId);
    if (postsErr) console.log("[delete-account] Posts delete error:", postsErr.message);

    const { error: tokensErr } = await adminClient.from("push_tokens").delete().eq("user_id", userId);
    if (tokensErr) console.log("[delete-account] Push tokens delete error:", tokensErr.message);

    const { error: userRowErr } = await adminClient.from("users").delete().eq("id", userId);
    if (userRowErr) console.log("[delete-account] User row delete error:", userRowErr.message);

    // Delete the auth user
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(userId);

    if (deleteAuthError) {
      console.error("[delete-account] Auth delete error:", deleteAuthError.message);
      return new Response(
        JSON.stringify({ error: "Não foi possível eliminar a conta no sistema de autenticação." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log("[delete-account] Account deleted successfully:", userId);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[delete-account] Exception:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
