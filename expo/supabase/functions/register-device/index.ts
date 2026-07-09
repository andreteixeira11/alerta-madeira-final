// Supabase Edge Function: register-device
// Registers or updates a device with OneSignal via the REST API.
// Called by the app after obtaining a native push token (APNs/FCM).
//
// Required Supabase secrets:
//   supabase secrets set ONESIGNAL_APP_ID=7ee2c5b5-00f8-4c43-88e6-cabc710eb592
//   supabase secrets set ONESIGNAL_REST_API_KEY=<your-rest-api-key>
//
// Deploy:
//   supabase functions deploy register-device --project-ref cefplgeamddmvshxbpbw

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface RegisterRequest {
  pushToken: string;
  deviceType: number; // 0 = iOS, 1 = Android
  userId?: string | null;
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
    const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID");
    const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY");

    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      console.error("[register-device] Missing OneSignal credentials");
      return new Response(
        JSON.stringify({ error: "OneSignal não configurado." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Try to verify the user (optional — registration can happen before login)
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();

    let authedUserId: string | null = null;
    if (token) {
      try {
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
        const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
        if (SUPABASE_URL && SUPABASE_ANON_KEY) {
          const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
            headers: {
              Authorization: `Bearer ${token}`,
              apikey: SUPABASE_ANON_KEY,
            },
          });
          if (res.ok) {
            const user = await res.json();
            authedUserId = user?.id ?? null;
          }
        }
      } catch {
        // Non-fatal — proceed without auth
      }
    }

    const { pushToken, deviceType, userId }: RegisterRequest = await req.json();

    if (!pushToken) {
      return new Response(
        JSON.stringify({ error: "pushToken é obrigatório." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const externalUserId = userId ?? authedUserId ?? null;

    // Build the OneSignal device registration payload
    const payload: Record<string, unknown> = {
      app_id: ONESIGNAL_APP_ID,
      identifier: pushToken,
      device_type: deviceType,
      test_type: 0,
    };

    if (externalUserId) {
      payload.external_user_id = externalUserId;
    }

    // First try to add a new device
    const addResponse = await fetch("https://onesignal.com/api/v1/players", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const addResult = await addResponse.json();

    // If the device already exists (status 400 with "already registered"),
    // update the existing record instead
    if (!addResponse.ok) {
      const errMsg = typeof addResult === "object" && addResult !== null
        ? JSON.stringify(addResult)
        : String(addResult);

      if (errMsg.includes("already") || errMsg.includes("exists") || errMsg.includes("duplicate")) {
        // Search for the existing player by identifier
        const searchUrl = `https://onesignal.com/api/v1/players?app_id=${ONESIGNAL_APP_ID}&limit=300`;
        const searchResponse = await fetch(searchUrl, {
          headers: { Authorization: `Basic ${ONESIGNAL_REST_API_KEY}` },
        });
        const searchData = await searchResponse.json();

        const existingPlayer = (searchData.players ?? []).find(
          (p: { identifier?: string; id?: string }) => p.identifier === pushToken
        );

        if (existingPlayer?.id) {
          // Update the existing device
          const updatePayload: Record<string, unknown> = {
            app_id: ONESIGNAL_APP_ID,
            identifier: pushToken,
            device_type: deviceType,
          };
          if (externalUserId) {
            updatePayload.external_user_id = externalUserId;
          } else {
            updatePayload.external_user_id = "";
          }

          await fetch(`https://onesignal.com/api/v1/players/${existingPlayer.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
            },
            body: JSON.stringify(updatePayload),
          });

          console.log("[register-device] Updated existing player:", existingPlayer.id);
          return new Response(
            JSON.stringify({ success: true, playerId: existingPlayer.id, updated: true }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
      }

      console.error("[register-device] Add failed:", errMsg);
      return new Response(
        JSON.stringify({ error: "Falha ao registar dispositivo." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const playerId = addResult.id;
    console.log("[register-device] New player registered:", playerId);

    return new Response(
      JSON.stringify({ success: true, playerId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[register-device] Exception:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
