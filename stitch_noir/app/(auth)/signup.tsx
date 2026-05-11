import React from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { useRouter } from 'expo-router';
import { User, Mail, Lock, ArrowRight } from 'lucide-react-native';

export default function SignupScreen() {
  const router = useRouter();

  return (
    <ScreenContainer>
      <View className="mt-12 mb-10">
        <Text variant="display" className="text-5xl">Create{"\n"}Account.</Text>
        <Text className="text-outline mt-2 text-lg">Join the elite world of AI social intelligence.</Text>
      </View>

      <View className="space-y-6">
        <View>
          <Text variant="label" className="mb-2">Full Name</Text>
          <Card className="bg-surface-container-lowest border border-outline-variant p-4 flex-row items-center">
            <User size={20} color="#958da1" className="mr-3" />
            <TextInput 
              className="flex-1 text-on-surface text-base"
              placeholder="Julian Stark"
              placeholderTextColor="#4a4455"
            />
          </Card>
        </View>

        <View>
          <Text variant="label" className="mb-2">Email Address</Text>
          <Card className="bg-surface-container-lowest border border-outline-variant p-4 flex-row items-center">
            <Mail size={20} color="#958da1" className="mr-3" />
            <TextInput 
              className="flex-1 text-on-surface text-base"
              placeholder="name@example.com"
              placeholderTextColor="#4a4455"
              autoCapitalize="none"
            />
          </Card>
        </View>

        <View>
          <Text variant="label" className="mb-2">Password</Text>
          <Card className="bg-surface-container-lowest border border-outline-variant p-4 flex-row items-center">
            <Lock size={20} color="#958da1" className="mr-3" />
            <TextInput 
              className="flex-1 text-on-surface text-base"
              placeholder="Minimum 8 characters"
              placeholderTextColor="#4a4455"
              secureTextEntry
            />
          </Card>
        </View>

        <Button 
          label="Create Account" 
          icon={ArrowRight} 
          iconPosition="right"
          className="mt-4 py-5 rounded-2xl"
          onPress={() => router.replace('/(main)/(tabs)')}
        />
      </View>

      <View className="mt-12 items-center pb-10">
        <Pressable onPress={() => router.push('/(auth)/login')}>
          <Text className="text-outline font-bold">Already have an account? <Text className="text-primary">Log In</Text></Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
