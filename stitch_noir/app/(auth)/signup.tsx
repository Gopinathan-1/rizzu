import React, { useState } from 'react';
import { View, TextInput, Pressable, Alert } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { useRouter } from 'expo-router';
import { User, Mail, Lock, ArrowRight } from 'lucide-react-native';
import { authService } from '@/services/auth';

export default function SignupScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!fullName || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    const { data, error } = await authService.signup(email, password, fullName);
    setLoading(false);

    if (error) {
      Alert.alert('Signup Failed', (error as any)?.message || 'An error occurred');
      return;
    }

    Alert.alert('Success', 'Account created! Please check your email to verify.');
    router.replace('/(auth)/login');
  };

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
              value={fullName}
              onChangeText={setFullName}
              editable={!loading}
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
              value={email}
              onChangeText={setEmail}
              editable={!loading}
              keyboardType="email-address"
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
              value={password}
              onChangeText={setPassword}
              editable={!loading}
            />
          </Card>
        </View>

        <Button 
          label={loading ? "Creating Account..." : "Create Account"}
          icon={loading ? undefined : ArrowRight} 
          iconPosition="right"
          className="mt-4 py-5 rounded-2xl"
          onPress={handleSignup}
          disabled={loading}
        />
      </View>

      <View className="mt-12 items-center pb-10">
        <Pressable onPress={() => router.push('/(auth)/login')} disabled={loading}>
          <Text className="text-outline font-bold">Already have an account? <Text className="text-primary">Log In</Text></Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
