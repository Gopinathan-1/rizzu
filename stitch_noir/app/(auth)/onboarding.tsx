import React from 'react';
import { View, Image, Dimensions, Pressable } from 'react-native';
import { Text } from '@/components/ui/Text';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { useRouter } from 'expo-router';
import { Sparkles, ArrowRight } from 'lucide-react-native';
import { useAppStore } from '@/store/useAppStore';

export default function OnboardingScreen() {
  const router = useRouter();
  const themeMode = useAppStore((state) => state.themeMode);
  const isLight = themeMode === 'light';

  return (
    <ScreenContainer scrollable={false} className="bg-background">
      <View className="flex-1 justify-center items-center">
        {/* Logo */}
        <View className="w-40 h-40 bg-surface-low rounded-3xl items-center justify-center mb-16 border border-outline-variant shadow-2xl">
          <Image 
            source={{ uri: 'https://i.ibb.co/LhqZz1z/screen.png' }} 
            className="w-32 h-32"
            resizeMode="contain"
          />
        </View>

        <View className="items-center px-6">
          <Text variant="display" className="text-center text-6xl tracking-tightest leading-[1] mb-6">Elite Social{"\n"}Intelligence.</Text>
          <View className="flex-row items-center gap-2 justify-center mb-4">
             <View className="w-1.5 h-1.5 rounded-full bg-primary" />
             <Text weight="bold" size="sm" className="text-primary tracking-widest uppercase">Powered by Aura AI</Text>
          </View>
          <Text className="text-center text-on-surface-variant text-lg leading-relaxed font-inter opacity-80">
            The world's most sophisticated AI texting assistant. Engineered for precision, speed, and absolute charisma.
          </Text>
        </View>
      </View>

      <View className="pb-12 gap-6">
        <Pressable 
          className="bg-primary-container h-16 rounded-2xl flex-row items-center justify-center active:brightness-110 shadow-lg"
          onPress={() => router.push('/(auth)/signup')}
        >
          <Text weight="bold" size="lg" className="text-on-primary-container mr-2">Get Started</Text>
          <ArrowRight size={22} color={isLight ? '#000000' : '#FFFFFF'} />
        </Pressable>
        
        <Pressable onPress={() => router.push('/(auth)/login')} className="items-center">
          <Text className="text-on-surface-variant font-inter">
            Already have an account? <Text className="text-primary font-inter-bold">Log In</Text>
          </Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
