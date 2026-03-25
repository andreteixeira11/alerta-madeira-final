import { Stack } from 'expo-router';
import React from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import Colors from '@/constants/colors';

function HeaderTitle() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Image
        source={require('@/assets/images/icon.png')}
        style={{ width: 30, height: 30, borderRadius: 8 }}
        contentFit="cover"
      />
      <Text style={{ fontSize: 18, fontWeight: '700' as const, color: Colors.text }}>Alerta Madeira</Text>
    </View>
  );
}

export default function HomeLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.white },
        headerTintColor: Colors.text,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{ headerTitle: () => <HeaderTitle /> }}
      />
    </Stack>
  );
}
