import * as z from "zod";
import { createTRPCRouter, publicProcedure } from "../create-context";

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID?.trim();
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY?.trim();

export const onesignalRouter = createTRPCRouter({
  sendNotification: publicProcedure
    .input(
      z.object({
        title: z.string().min(1),
        body: z.string().min(1),
        url: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      console.log("[OneSignal] Sending notification:", input.title);

      if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
        console.log("[OneSignal] Missing ONESIGNAL_APP_ID or ONESIGNAL_REST_API_KEY");
        throw new Error("OneSignal não está configurado. Verifique as variáveis de ambiente.");
      }

      if (!/^[0-9a-fA-F-]{36}$/.test(ONESIGNAL_APP_ID)) {
        console.log("[OneSignal] Invalid app id format:", ONESIGNAL_APP_ID);
        throw new Error("ONESIGNAL_APP_ID inválido.");
      }

      const payload: Record<string, unknown> = {
        app_id: ONESIGNAL_APP_ID,
        included_segments: ["All"],
        headings: { en: input.title, pt: input.title },
        contents: { en: input.body, pt: input.body },
      };

      if (input.url) {
        payload.url = input.url;
        payload.web_url = input.url;
      }

      try {
        const response = await fetch("https://onesignal.com/api/v1/notifications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
          },
          body: JSON.stringify(payload),
        });

        const result = await response.json();
        console.log("[OneSignal] Response:", JSON.stringify(result));

        if (result.errors && result.errors.length > 0) {
          console.log("[OneSignal] Errors:", result.errors);
          throw new Error(result.errors.join(", "));
        }

        return {
          success: true,
          id: result.id,
          recipients: result.recipients ?? 0,
        };
      } catch (err: any) {
        console.log("[OneSignal] Exception:", err.message);
        throw new Error(err.message || "Erro ao enviar notificação via OneSignal");
      }
    }),
});
