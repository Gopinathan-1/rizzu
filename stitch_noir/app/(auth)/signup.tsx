import React, { useState } from 'react';
import { View, TextInput, Pressable, Alert } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { useRouter } from 'expo-router';
import { User, Mail, Lock, ArrowRight, Check } from 'lucide-react-native';
import { authService } from '@/services/auth';

export default function SignupScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<'fullName' | 'email' | 'password' | null>(null);

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
      <View className="mt-10 mb-8">
        <Text variant="display" className="text-5xl tracking-tight">Create{"\n"}Account.</Text>
        <Text className="mt-3 max-w-[320px] text-base leading-6 text-outline">
          Join the elite world of AI social intelligence.
        </Text>
      </View>

      <View className="gap-5">
        <View>
          <Text variant="label" className="mb-3 text-on-surface-variant">Full Name</Text>
          <Card className="flex-row items-center rounded-2xl border border-outline-variant bg-surface-low px-4 py-4">
            <User size={20} color="#958da1" className="mr-3" />
            <TextInput 
              className="flex-1 pl-1 text-on-surface text-base"
              placeholder={focusedField === 'fullName' ? '' : 'Julian Stark'}
              placeholderTextColor="#4a4455"
              value={fullName}
              onChangeText={setFullName}
              editable={!loading}
              onFocus={() => setFocusedField('fullName')}
              onBlur={() => setFocusedField((current) => (current === 'fullName' ? null : current))}
            />
          </Card>
        </View>

        <View>
          <Text variant="label" className="mb-3 text-on-surface-variant">Email Address</Text>
          <Card className="flex-row items-center rounded-2xl border border-outline-variant bg-surface-low px-4 py-4">
            <Mail size={20} color="#958da1" className="mr-3" />
            <TextInput 
              className="flex-1 pl-1 text-on-surface text-base"
              placeholder={focusedField === 'email' ? '' : 'name@example.com'}
              placeholderTextColor="#4a4455"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              editable={!loading}
              keyboardType="email-address"
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField((current) => (current === 'email' ? null : current))}
            />
          </Card>
        </View>

        <View>
          <Text variant="label" className="mb-3 text-on-surface-variant">Password</Text>
          <Card className="flex-row items-center rounded-2xl border border-outline-variant bg-surface-low px-4 py-4">
            <Lock size={20} color="#958da1" className="mr-3" />
            <TextInput 
              className="flex-1 pl-1 text-on-surface text-base"
              placeholder={focusedField === 'password' ? '' : 'Minimum 8 characters'}
              placeholderTextColor="#4a4455"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              editable={!loading}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField((current) => (current === 'password' ? null : current))}
            />
          </Card>
          <Pressable
            onPress={() => setShowPassword((current) => !current)}
            disabled={loading}
            className="mt-3 flex-row items-center gap-3 self-start rounded-full border border-white/10 bg-white/5 px-3 py-2"
          >
            <View className={`h-4 w-4 items-center justify-center rounded-[4px] border ${showPassword ? 'border-white bg-primary' : 'border-white/80 bg-transparent'}`}>
              {showPassword ? <Check size={14} color="#ffffff" strokeWidth={3} /> : null}
            </View>
            <Text size="sm" className="text-on-surface-variant">Show Password</Text>
          </Pressable>
        </View>

        <Button 
          label={loading ? "Creating Account..." : "Create Account"}
          icon={loading ? undefined : ArrowRight} 
          iconPosition="right"
          className="mt-2 py-5 rounded-2xl"
          onPress={handleSignup}
          disabled={loading}
        />
      </View>

      <View className="mt-10 items-center pb-10">
        <Pressable onPress={() => router.push('/(auth)/login')} disabled={loading}>
          <Text className="text-outline font-bold">Already have an account? <Text className="text-primary">Log In</Text></Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
