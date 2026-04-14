import { httpLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";

import { supabase } from "@/lib/supabase";
import type { AppRouter } from "@/backend/trpc/app-router";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  const url = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  return url ?? '';
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      headers: async () => {
        const { data } = await supabase.auth.getSession();
        const accessToken = data.session?.access_token;

        return accessToken
          ? { Authorization: `Bearer ${accessToken}` }
          : {};
      },
    }),
  ],
});
