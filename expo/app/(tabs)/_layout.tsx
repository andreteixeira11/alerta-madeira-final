import { Tabs } from 'expo-router';
import React from 'react';
import { AlertTriangle, ShieldAlert, Construction, Dog, User } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { t } from '@/utils/i18n';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.borderLight,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: t('tabs.incidents'),
          tabBarIcon: ({ color, size }) => <AlertTriangle size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="opstop"
        options={{
          title: t('tabs.operationStop'),
          tabBarIcon: ({ color, size }) => <ShieldAlert size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="perdidos"
        options={{
          title: t('tabs.lostFound'),
          tabBarIcon: ({ color, size }) => <Dog size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="anomalias"
        options={{
          title: t('tabs.anomalies'),
          tabBarIcon: ({ color, size }) => <Construction size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
