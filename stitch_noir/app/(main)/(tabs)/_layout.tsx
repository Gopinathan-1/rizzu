import { Tabs } from 'expo-router';
import { MessageSquare, Sparkles, UserCircle, ShieldCheck } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@/store/useAppStore';
import { View } from 'react-native';
import { CHOCOLATE_TRUFFLE_DARK, CHOCOLATE_TRUFFLE_LIGHT } from '@/theme/palette';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const themeMode = useAppStore((state) => state.themeMode);
  const isLight = themeMode === 'light';

  // shades (avoid pure #000)
  const activeLight = CHOCOLATE_TRUFFLE_LIGHT.textPrimary;
  const activeDark = CHOCOLATE_TRUFFLE_DARK.textPrimary;
  const inactiveLight = CHOCOLATE_TRUFFLE_LIGHT.textSecondary;
  const inactiveDark = CHOCOLATE_TRUFFLE_DARK.textSecondary;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: isLight ? activeLight : activeDark,
        tabBarInactiveTintColor: isLight ? inactiveLight : inactiveDark,
        tabBarStyle: {
          backgroundColor: isLight ? CHOCOLATE_TRUFFLE_LIGHT.bgPrimary : CHOCOLATE_TRUFFLE_DARK.bgPrimary,
          borderTopColor: isLight ? CHOCOLATE_TRUFFLE_LIGHT.border : CHOCOLATE_TRUFFLE_DARK.border,
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
                backgroundColor: focused ? (isLight ? CHOCOLATE_TRUFFLE_LIGHT.bgSurface : CHOCOLATE_TRUFFLE_DARK.bgSurface) : 'transparent'
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
                backgroundColor: focused ? (isLight ? CHOCOLATE_TRUFFLE_LIGHT.bgSurface : CHOCOLATE_TRUFFLE_DARK.bgSurface) : 'transparent'
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
                backgroundColor: focused ? (isLight ? CHOCOLATE_TRUFFLE_LIGHT.bgSurface : CHOCOLATE_TRUFFLE_DARK.bgSurface) : 'transparent'
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
