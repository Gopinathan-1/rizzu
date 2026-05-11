import { Tabs } from 'expo-router';
import { MessageSquare, Sparkles, UserCircle, ShieldCheck } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#d3bbff',
        tabBarInactiveTintColor: '#958da1',
        tabBarStyle: {
          backgroundColor: '#080808',
          borderTopColor: '#262626',
          height: 85,
          paddingBottom: 25,
          paddingTop: 10,
        },
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color }) => <MessageSquare size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tones"
        options={{
          title: 'Tones',
          tabBarIcon: ({ color }) => <Sparkles size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="bios"
        options={{
          title: 'Bios',
          tabBarIcon: ({ color }) => <UserCircle size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="vault"
        options={{
          title: 'Vault',
          tabBarIcon: ({ color }) => <ShieldCheck size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
