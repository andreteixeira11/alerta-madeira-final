import { Tabs } from 'expo-router';
import React from 'react';
import { AlertTriangle, ShieldAlert, Construction, Dog, User } from 'lucide-react-native';
import Colors from '@/constants/colors';

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
          title: 'Ocorrências',
          tabBarIcon: ({ color, size }) => <AlertTriangle size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="opstop"
        options={{
          title: 'Op. Stop',
          tabBarIcon: ({ color, size }) => <ShieldAlert size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="perdidos"
        options={{
          title: 'Perdidos',
          tabBarIcon: ({ color, size }) => <Dog size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="anomalias"
        options={{
          title: 'Anomalias',
          tabBarIcon: ({ color, size }) => <Construction size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
