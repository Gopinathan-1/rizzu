import React from 'react';
import { View, TextInput, Pressable, Image } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { useRouter } from 'expo-router';
import { Mail, Lock, ArrowRight, Github } from 'lucide-react-native';

export default function LoginScreen() {
  const router = useRouter();

  return (
    <ScreenContainer className="bg-background">
      <View className="mt-16 mb-12">
        <Text variant="display" className="text-6xl tracking-tightest">Welcome{"\n"}Back.</Text>
        <View className="flex-row items-center gap-2 mt-4">
          <View className="w-2 h-2 rounded-full bg-primary" />
          <Text className="text-on-surface-variant text-lg font-inter">Secure access to your AI workspace.</Text>
        </View>
      </View>

      <View className="gap-6">
        <View>
          <Text variant="label" className="mb-3 text-on-surface-variant">Email Address</Text>
          <Card className="bg-surface-low border border-outline-variant p-5 flex-row items-center rounded-2xl">
            <Mail size={20} color="#958da1" className="mr-3" />
            <TextInput 
              className="flex-1 text-on-surface text-base font-inter"
              placeholder="name@example.com"
              placeholderTextColor="#4a4455"
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </Card>
        </View>

        <View>
          <Text variant="label" className="mb-3 text-on-surface-variant">Password</Text>
          <Card className="bg-surface-low border border-outline-variant p-5 flex-row items-center rounded-2xl">
            <Lock size={20} color="#958da1" className="mr-3" />
            <TextInput 
              className="flex-1 text-on-surface text-base font-inter"
              placeholder="••••••••"
              placeholderTextColor="#4a4455"
              secureTextEntry
            />
          </Card>
          <Pressable className="mt-4 items-end">
            <Text className="text-primary text-xs font-bold tracking-wider">FORGOT PASSWORD?</Text>
          </Pressable>
        </View>

        <Pressable 
          className="bg-primary-container h-16 rounded-2xl flex-row items-center justify-center mt-4 active:brightness-110 shadow-lg"
          onPress={() => router.replace('/(main)/(tabs)')}
        >
          <Text weight="bold" size="lg" className="text-on-primary-container mr-2">Log In</Text>
          <ArrowRight size={20} color="#dac5ff" />
        </Pressable>

        <View className="flex-row items-center my-8">
          <View className="flex-1 h-[1px] bg-outline-variant" />
          <Text className="mx-4 text-on-surface-variant text-[10px] font-inter-bold tracking-widest uppercase opacity-50">OR CONTINUE WITH</Text>
          <View className="flex-1 h-[1px] bg-outline-variant" />
        </View>

        <View className="flex-row gap-4">
           <Pressable className="flex-1 h-14 bg-surface-low border border-outline-variant rounded-2xl items-center justify-center active:bg-surface-high">
              <Image 
                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }} 
                className="w-5 h-5"
              />
           </Pressable>
           <Pressable className="flex-1 h-14 bg-surface-low border border-outline-variant rounded-2xl items-center justify-center active:bg-surface-high">
              <Github size={22} color="#f5f5f5" />
           </Pressable>
        </View>
      </View>

      <View className="mt-16 mb-8 items-center">
        <Pressable onPress={() => router.push('/(auth)/signup')}>
          <Text className="text-on-surface-variant font-inter">Don't have an account? <Text className="text-primary font-inter-bold">Sign Up</Text></Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
