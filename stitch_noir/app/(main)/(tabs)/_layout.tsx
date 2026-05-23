import { Tabs } from 'expo-router';
import { MessageSquare, Sparkles, UserCircle, ShieldCheck } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@/store/useAppStore';
import { View } from 'react-native';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const themeMode = useAppStore((state) => state.themeMode);
  const isLight = themeMode === 'light';

  // shades (avoid pure #000)
  const activeLight = '#1A1A1A';
  const activeDark = '#FFFFFF';
  const inactiveLight = '#6B7280'; // gray-500
  const inactiveDark = '#9CA3AF'; // lighter gray on dark

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: isLight ? activeLight : activeDark,
        tabBarInactiveTintColor: isLight ? inactiveLight : inactiveDark,
        tabBarStyle: {
          backgroundColor: isLight ? '#ffffff' : '#000000',
          borderTopColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
          height: 60 + (insets.bottom ?? 0),
          paddingBottom: (insets.bottom ?? 10),
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: 'Inter-SemiBold',
          marginTop: 4,
        },
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ height: 40, width: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 999 }}>
              <View style={{
                height: 40,
                width: 40,
                borderRadius: 999,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: focused ? (isLight ? 'rgba(26,26,26,0.06)' : 'rgba(255,255,255,0.12)') : 'transparent'
              }}>
                <MessageSquare size={22} color={color} />
              </View>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="tones"
        options={{
          title: 'Tone',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ height: 40, width: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 999 }}>
              <View style={{
                height: 40,
                width: 40,
                borderRadius: 999,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: focused ? (isLight ? 'rgba(26,26,26,0.06)' : 'rgba(255,255,255,0.12)') : 'transparent'
              }}>
                <Sparkles size={22} color={color} />
              </View>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="bios"
        options={{
          title: 'Bio',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ height: 40, width: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 999 }}>
              <View style={{
                height: 40,
                width: 40,
                borderRadius: 999,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: focused ? (isLight ? 'rgba(26,26,26,0.06)' : 'rgba(255,255,255,0.12)') : 'transparent'
              }}>
                <UserCircle size={22} color={color} />
              </View>
            </View>
          ),
        }}
      />
      {/* Vault tab removed per request */}
    </Tabs>
  );
}
