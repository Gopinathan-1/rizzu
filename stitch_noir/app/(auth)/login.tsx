import React, { useState } from 'react';
import { View, TextInput, Pressable, Alert } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { useRouter } from 'expo-router';
import { Mail, Lock, ArrowRight } from 'lucide-react-native';
import { authService } from '@/services/auth';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    const { data, error } = await authService.login(email, password);
    setLoading(false);

    if (error) {
      Alert.alert('Login Failed', (error as any)?.message || 'Invalid email or password');
      return;
    }

    Alert.alert('Success', 'Welcome back!');
    router.replace('/(main)/(tabs)');
  };

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
              value={email}
              onChangeText={setEmail}
              editable={!loading}
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
              value={password}
              onChangeText={setPassword}
              editable={!loading}
            />
          </Card>
          <Pressable className="mt-4 items-end" disabled={loading}>
            <Text className="text-primary text-xs font-bold tracking-wider">FORGOT PASSWORD?</Text>
          </Pressable>
        </View>

        <Pressable 
          className="bg-primary-container h-16 rounded-2xl flex-row items-center justify-center mt-4 active:brightness-110 shadow-lg"
          onPress={handleLogin}
          disabled={loading}
        >
          <Text weight="bold" size="lg" className="text-on-primary-container mr-2">{loading ? 'Logging In...' : 'Log In'}</Text>
          <ArrowRight size={20} color="#dac5ff" />
        </Pressable>
      </View>

      <View className="mt-16 mb-8 items-center">
        <Pressable onPress={() => router.push('/(auth)/signup')} disabled={loading}>
          <Text className="text-on-surface-variant font-inter">Don't have an account? <Text className="text-primary font-inter-bold">Sign Up</Text></Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
