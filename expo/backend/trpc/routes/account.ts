import { createClient } from "@supabase/supabase-js";

import { createTRPCRouter, publicProcedure } from "../create-context";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";

export const accountRouter = createTRPCRouter({
  deleteMyAccount: publicProcedure.mutation(async ({ ctx }) => {
    console.log("[Account] Starting self-delete flow");

    const authorization = ctx.req.headers.get("authorization") ?? "";
    const accessToken = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";

    if (!supabaseUrl || !serviceRoleKey) {
      console.log("[Account] Missing Supabase server configuration");
      throw new Error("Configuração do servidor incompleta para eliminar a conta.");
    }

    if (!accessToken) {
      console.log("[Account] Missing access token");
      throw new Error("Sessão inválida. Faça login novamente.");
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: authUserData, error: authUserError } = await supabaseAdmin.auth.getUser(accessToken);

    if (authUserError || !authUserData.user) {
      console.log("[Account] Failed to load auth user:", authUserError?.message);
      throw new Error("Não foi possível validar a sessão atual.");
    }

    const userId = authUserData.user.id;
    console.log("[Account] Deleting account for user:", userId);

    const { error: commentsErr } = await supabaseAdmin.from("comments").delete().eq("user_id", userId);
    if (commentsErr) {
      console.log("[Account] Comments delete error:", commentsErr.message);
    }

    const { error: postsErr } = await supabaseAdmin.from("posts").delete().eq("user_id", userId);
    if (postsErr) {
      console.log("[Account] Posts delete error:", postsErr.message);
    }

    const { error: tokensErr } = await supabaseAdmin.from("push_tokens").delete().eq("user_id", userId);
    if (tokensErr) {
      console.log("[Account] Push tokens delete error:", tokensErr.message);
    }

    const { error: userRowErr } = await supabaseAdmin.from("users").delete().eq("id", userId);
    if (userRowErr) {
      console.log("[Account] User row delete error:", userRowErr.message);
    }

    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteAuthError) {
      console.log("[Account] Auth delete error:", deleteAuthError.message);
      throw new Error("Não foi possível eliminar a conta no sistema de autenticação.");
    }

    console.log("[Account] Account deleted successfully:", userId);

    return {
      success: true,
    };
  }),
});
