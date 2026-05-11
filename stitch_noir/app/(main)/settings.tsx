import React from 'react';
import { View, Pressable, Switch, ScrollView } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { useRouter } from 'expo-router';
import { 
  ChevronLeft, 
  User, 
  Bell, 
  Shield, 
  CreditCard, 
  HelpCircle, 
  LogOut,
  ChevronRight,
  Zap
} from 'lucide-react-native';

export default function SettingsScreen() {
  const router = useRouter();

  const MenuItem = ({ icon: Icon, label, value, onPress, color = "#e8e0ee" }: any) => (
    <Pressable 
      onPress={onPress}
      className="flex-row items-center justify-between py-5 border-b border-outline-variant/30"
    >
      <View className="flex-row items-center">
        <View className="w-10 h-10 rounded-full bg-surface-container-high items-center justify-center mr-4">
          <Icon size={20} color={color} />
        </View>
        <Text weight="semibold" size="lg">{label}</Text>
      </View>
      <View className="flex-row items-center">
        {value && <Text className="text-outline mr-2">{value}</Text>}
        <ChevronRight size={20} color="#4a4455" />
      </View>
    </Pressable>
  );

  return (
    <ScreenContainer>
      {/* Header */}
      <View className="flex-row items-center py-4">
        <Pressable onPress={() => router.back()}>
          <ChevronLeft size={24} color="#e8e0ee" />
        </Pressable>
        <Text variant="headline" className="ml-4">Settings</Text>
      </View>

      {/* Profile Card */}
      <Card className="mt-6 p-6 flex-row items-center bg-primary-container/10 border border-primary/20">
        <View className="w-16 h-16 rounded-full bg-slate-800 mr-4 border-2 border-primary/40 overflow-hidden" />
        <View className="flex-1">
          <Text weight="bold" size="xl">Julian Stark</Text>
          <Text className="text-primary text-xs font-bold tracking-widest uppercase">PRO PLAN ACTIVE</Text>
        </View>
        <Pressable className="bg-primary-container px-4 py-2 rounded-lg">
          <Text weight="bold" size="sm" className="text-on-primary-container">Edit</Text>
        </Pressable>
      </Card>

      {/* Subscription Promo */}
      <Card className="mt-6 p-6 bg-secondary-container/20 border border-secondary/20">
        <View className="flex-row justify-between items-start mb-4">
          <View>
             <Text weight="bold" size="lg">Upgrade to Elite</Text>
             <Text className="text-outline text-sm mt-1">Unlock GPT-5 Turbo and Unlimited analysis.</Text>
          </View>
          <Zap size={24} color="#adc6ff" />
        </View>
        <Button 
          label="View Plans" 
          variant="secondary" 
          size="sm" 
          className="rounded-xl py-3"
          onPress={() => router.push('/(main)/paywall')}
        />
      </Card>

      <View className="mt-10">
        <Text variant="label" className="mb-2">Account</Text>
        <MenuItem icon={User} label="Personal Information" />
        <MenuItem icon={Bell} label="Notifications" value="On" />
        <MenuItem icon={Shield} label="Privacy & Security" />
      </View>

      <View className="mt-8">
        <Text variant="label" className="mb-2">Billing</Text>
        <MenuItem icon={CreditCard} label="Payment Methods" />
        <MenuItem icon={Zap} label="Subscription Plan" value="Pro" />
      </View>

      <View className="mt-8">
        <Text variant="label" className="mb-2">Support</Text>
        <MenuItem icon={HelpCircle} label="Help Center" />
        <MenuItem icon={LogOut} label="Log Out" color="#ffb2b7" />
      </View>

      <View className="mt-12 mb-10 items-center">
        <Text className="text-outline text-xs">Aura AI v1.0.42</Text>
        <Text className="text-outline text-[10px] mt-1">Crafted with precision in San Francisco</Text>
      </View>
    </ScreenContainer>
  );
}
