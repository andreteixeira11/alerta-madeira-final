import { httpLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import Constants from "expo-constants";
import superjson from "superjson";

import { supabase } from "@/lib/supabase";
import type { AppRouter } from "@/backend/trpc/app-router";

export const trpc = createTRPCReact<AppRouter>();

type RuntimeExtraConfig = {
  rorkApiBaseUrl?: string;
  rorkFunctionsUrl?: string;
  EXPO_PUBLIC_RORK_API_BASE_URL?: string;
  EXPO_PUBLIC_RORK_FUNCTIONS_URL?: string;
};

type RuntimeManifestConfig = {
  extra?: RuntimeExtraConfig;
};

function getRuntimeExtraConfig(): RuntimeExtraConfig {
  const constantsWithManifests = Constants as typeof Constants & {
    manifest?: RuntimeManifestConfig | null;
    manifest2?: RuntimeManifestConfig | null;
  };

  return constantsWithManifests.expoConfig?.extra
    ?? constantsWithManifests.manifest2?.extra
    ?? constantsWithManifests.manifest?.extra
    ?? {};
}

const getBaseUrl = (): string => {
  const extra = getRuntimeExtraConfig();
  const url = process.env.EXPO_PUBLIC_RORK_API_BASE_URL
    ?? extra.rorkApiBaseUrl
    ?? extra.EXPO_PUBLIC_RORK_API_BASE_URL
    ?? process.env.EXPO_PUBLIC_RORK_FUNCTIONS_URL
    ?? extra.rorkFunctionsUrl
    ?? extra.EXPO_PUBLIC_RORK_FUNCTIONS_URL
    ?? '';

  return url.trim().replace(/\/$/, '');
};

const baseUrl = getBaseUrl();

if (!baseUrl) {
  console.log('[TRPC] Missing API base URL. Password recovery and server actions will be unavailable.');
}

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${baseUrl}/api/trpc`,
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
