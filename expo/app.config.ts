import type { ExpoConfig } from 'expo/config';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';
const oneSignalAppId = process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID?.trim() ?? '';

function validateSupabaseUrl(url: string) {
  if (!url) return;
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)) {
    throw new Error('[app.config] SUPABASE_URL inválido');
  }
}

function validateAnonKey(key: string) {
  if (!key) return;
  if (key.split('.').length !== 3) {
    throw new Error('[app.config] SUPABASE_ANON_KEY inválido');
  }
}

// valida apenas em dev
if (process.env.NODE_ENV === 'development') {
  validateSupabaseUrl(supabaseUrl);
  validateAnonKey(supabaseAnonKey);
}

const config: ExpoConfig = {
  name: 'Alerta Madeira',
  slug: 'alertamadeira',
  version: '1.0.1',

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
    bundleIdentifier: 'app.alerta.madeira',
    buildNumber: "4",
    infoPlist: {
      NSCameraUsageDescription: 'The camera is used to take photos of incidents (for example, a fire or road accident) so you can attach the image to your incident report and submit it in the app.',
      NSPhotoLibraryUsageDescription: 'The photo library is used to select existing photos (for example, a hazard photo you took earlier) so you can attach the image to your incident report and submit it in the app.',
      NSPhotoLibraryAddUsageDescription: 'The photo library is used to save images related to your reports (for example, a copy of the photo submitted with an incident) so you can reference them later.',
      NSLocationWhenInUseUsageDescription: 'Location is used when you create an incident so the report includes the approximate incident position (for example, where an accident or fire happened) in the app.',
    },
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
    [
      'onesignal-expo-plugin',
      {
        mode: 'production',
      },
    ],
  ],

  experiments: {
    typedRoutes: true,
  },

  extra: {
    supabaseUrl,
    supabaseAnonKey,
    oneSignalAppId,

    eas: {
      projectId: "c54bf538-c087-47a3-a011-28d949d86587"
    }
  },
};

export default config;