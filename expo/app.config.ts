import type { ExpoConfig } from 'expo/config';

function getRequiredEnv(name: 'EXPO_PUBLIC_SUPABASE_URL' | 'EXPO_PUBLIC_SUPABASE_ANON_KEY'): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`[app.config] Missing required environment variable: ${name}`);
  }

  if (value.startsWith('sb_temp_')) {
    throw new Error(`[app.config] Temporary Supabase key detected in ${name}`);
  }

  return value;
}

const supabaseUrl = getRequiredEnv('EXPO_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = getRequiredEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY');

if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(supabaseUrl)) {
  throw new Error('[app.config] EXPO_PUBLIC_SUPABASE_URL is not a valid Supabase project URL');
}

if (supabaseAnonKey.split('.').length !== 3) {
  throw new Error('[app.config] EXPO_PUBLIC_SUPABASE_ANON_KEY is not a valid anon JWT');
}

const config: ExpoConfig = {
  name: 'Alerta Madeira',
  slug: 'alertamadeira',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'rork-app',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  splash: {
    image: './assets/images/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'alerta.madeira',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    package: 'alerta.madeira',
  },
  web: {
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    [
      'expo-router',
      {
        origin: 'https://rork.com/',
      },
    ],
    'expo-font',
    'expo-web-browser',
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    supabaseUrl,
    supabaseAnonKey,
  },
};

export default config;
