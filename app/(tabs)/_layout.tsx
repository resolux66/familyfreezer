// 📘 React Native Note — Tab navigator
// The Tabs component from Expo Router generates a bottom tab bar automatically
// from the <Tabs.Screen> children. Each 'name' prop must match a filename in
// this (tabs) folder. The tab bar handles iPhone home-indicator safe area
// padding automatically — you don't need to add extra padding yourself.
//
// tabBarActiveTintColor / tabBarInactiveTintColor apply to BOTH the icon
// and the label text — you don't need to set icon colour separately.

import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, Search, Settings } from 'lucide-react-native';

import { useNotificationSetup } from '@/hooks/useNotifications';
import { DemoBanner } from '@/components/ui/DemoBanner';

// 📘 React Native Note — calling hooks in layout components
// TabLayout renders once when the user enters the authenticated tabs.
// We call useNotificationSetup() here rather than in the root layout so
// that notification registration only fires after the user is confirmed
// logged in. The root layout runs before checkSession() resolves, so
// user would be null and registration would silently no-op.

export default function TabLayout() {
  useNotificationSetup();

  return (
    <View style={{ flex: 1 }}>
      <DemoBanner />
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1A3A5C',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: { borderTopColor: '#E2E8F0' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => <Search color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
        }}
      />
    </Tabs>
    </View>
  );
}
