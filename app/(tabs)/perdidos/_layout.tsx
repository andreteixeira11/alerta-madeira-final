import { Stack } from 'expo-router';
import React from 'react';
import Colors from '@/constants/colors';

export default function PerdidosLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.white },
        headerTintColor: Colors.text,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Perdidos e Achados' }} />
    </Stack>
  );
}
