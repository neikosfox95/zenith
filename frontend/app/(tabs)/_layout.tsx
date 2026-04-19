import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import { TikTokColors } from '../../src/constants/tiktokTheme';

export default function TabsLayout() {
  const { theme } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: TikTokColors.pink,
        tabBarInactiveTintColor: TikTokColors.textSecondary,
        tabBarStyle: {
          backgroundColor: TikTokColors.background,
          borderTopColor: TikTokColors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600'
        }
      }}
    >
      {/* Main Tab: Home/Dashboard with all 30 phases */}
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />

      {/* All Phase Screens - Hidden from tab bar but accessible via navigation */}
      <Tabs.Screen name="dashboard" options={{ href: null }} />
      <Tabs.Screen name="creators" options={{ href: null }} />
      <Tabs.Screen name="fans" options={{ href: null }} />
      <Tabs.Screen name="analytics" options={{ href: null }} />
      <Tabs.Screen name="ai" options={{ href: null }} />
      <Tabs.Screen name="code" options={{ href: null }} />
      <Tabs.Screen name="voice" options={{ href: null }} />
      <Tabs.Screen name="media" options={{ href: null }} />
      <Tabs.Screen name="enterprise" options={{ href: null }} />
      <Tabs.Screen name="history" options={{ href: null }} />
      <Tabs.Screen name="phase10" options={{ href: null }} />
      <Tabs.Screen name="phase11" options={{ href: null }} />
      <Tabs.Screen name="phase12" options={{ href: null }} />
      <Tabs.Screen name="phase13" options={{ href: null }} />
      <Tabs.Screen name="phase14" options={{ href: null }} />
      <Tabs.Screen name="phase15" options={{ href: null }} />
      <Tabs.Screen name="phase16" options={{ href: null }} />
      <Tabs.Screen name="phase17" options={{ href: null }} />
      <Tabs.Screen name="phase18" options={{ href: null }} />
      <Tabs.Screen name="phase19" options={{ href: null }} />
      <Tabs.Screen name="phase20" options={{ href: null }} />
      <Tabs.Screen name="phase21" options={{ href: null }} />
      <Tabs.Screen name="phase22" options={{ href: null }} />
      <Tabs.Screen name="phase23" options={{ href: null }} />
      <Tabs.Screen name="phase24" options={{ href: null }} />
      <Tabs.Screen name="phase25" options={{ href: null }} />
      <Tabs.Screen name="phase26" options={{ href: null }} />
      <Tabs.Screen name="phase27" options={{ href: null }} />
      <Tabs.Screen name="phase28" options={{ href: null }} />
      <Tabs.Screen name="phase29" options={{ href: null }} />
      <Tabs.Screen name="phase30" options={{ href: null }} />

      {/* Settings Tab */}
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

