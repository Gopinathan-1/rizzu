import React, { useState } from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { ThemedDialog } from '@/components/ui/ThemedDialog';
import { useRouter } from 'expo-router';
import { Mail, Lock, ArrowRight, Check, AlertCircle, CircleCheckBig } from 'lucide-react-native';
import { useAppStore } from '@/store/useAppStore';
import { authService } from '@/services/auth';
import { CHOCOLATE_TRUFFLE_DARK, CHOCOLATE_TRUFFLE_LIGHT } from '@/theme/palette';

type DialogState = {
  title: string;
  message: string;
  tone: 'info' | 'success' | 'danger';
  icon: typeof AlertCircle;
  actionLabel: string;
  onAction: () => void;
  dismissible?: boolean;
};

export default function LoginScreen() {
  const router = useRouter();
  const themeMode = useAppStore((state) => state.themeMode);
  const isLight = themeMode === 'light';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const closeDialog = () => setDialog(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setDialog({
        title: 'Missing details',
        message: 'Please fill in all fields before logging in.',
        tone: 'danger',
        icon: AlertCircle,
        actionLabel: 'OK',
        onAction: closeDialog,
      });
      return;
    }

    setLoading(true);
    const { data, error } = await authService.login(email, password);
    setLoading(false);

    if (error) {
      setDialog({
        title: 'Login failed',
        message: (error as any)?.message || 'Invalid email or password.',
        tone: 'danger',
        icon: AlertCircle,
        actionLabel: 'Try again',
        onAction: closeDialog,
      });
      return;
    }

    setDialog({
      title: 'Welcome back',
      message: 'Your workspace is ready.',
      tone: 'success',
      icon: CircleCheckBig,
      actionLabel: 'Continue',
      onAction: () => {
        closeDialog();
        router.replace('/(main)/(tabs)');
      },
      dismissible: false,
    });
  };

  return (
    <ScreenContainer className="bg-background">
      <View className="mt-16 mb-10">
        <Text variant="display" className="text-5xl tracking-tightest">Welcome Back</Text>
        <View className="flex-row items-center gap-2 mt-4">
          {/* <View className="w-2 h-2 rounded-full bg-accent" /> */}
          <Text className="text-text-secondary text-lg font-inter"></Text>
        </View>
      </View>

      <View className="gap-6">
        <View>
          <Text variant="label" className="mb-3 text-text-secondary">Email Address</Text>
          <Card className="bg-surface border border-border p-5 flex-row items-center rounded-2xl">
            <Mail size={20} color={isLight ? CHOCOLATE_TRUFFLE_LIGHT.textPrimary : CHOCOLATE_TRUFFLE_DARK.textPrimary} className="mr-3" />
            <TextInput 
              className="flex-1 pl-1 text-on-surface text-base font-inter"
              placeholder={focusedField === 'email' ? '' : 'name@example.com'}
              placeholderTextColor={isLight ? CHOCOLATE_TRUFFLE_LIGHT.textSecondary : CHOCOLATE_TRUFFLE_DARK.textSecondary}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              editable={!loading}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField((current) => (current === 'email' ? null : current))}
            />
          </Card>
        </View>

        <View>
          <Text variant="label" className="mb-3 text-text-secondary">Password</Text>
          <Card className="bg-surface border border-border p-5 flex-row items-center rounded-2xl">
            <Lock size={20} color={isLight ? CHOCOLATE_TRUFFLE_LIGHT.textPrimary : CHOCOLATE_TRUFFLE_DARK.textPrimary} className="mr-3" />
            <TextInput 
              className="flex-1 pl-1 text-on-surface text-base font-inter"
              placeholder={focusedField === 'password' ? '' : '••••••••'}
              placeholderTextColor={isLight ? CHOCOLATE_TRUFFLE_LIGHT.textSecondary : CHOCOLATE_TRUFFLE_DARK.textSecondary}
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
            className="mt-3 flex-row items-center gap-3 self-start rounded-full border border-border bg-bg-elevated px-3 py-2"
          >
            <View className={`h-4 w-4 items-center justify-center rounded-[4px] border ${showPassword ? 'border-accent bg-accent' : 'border-border bg-white'}`}>
              {showPassword ? <Check size={14} color={isLight ? CHOCOLATE_TRUFFLE_LIGHT.bgPrimary : CHOCOLATE_TRUFFLE_DARK.bgPrimary} strokeWidth={3} /> : null}
            </View>
            <Text size="sm" className="text-text-secondary">Show Password</Text>
          </Pressable>
          <Pressable className="mt-4 items-end" disabled={loading}>
            <Text className="text-accent text-xs font-bold tracking-wider">FORGOT PASSWORD?</Text>
          </Pressable>
        </View>

        <Button
          label={loading ? 'Logging In...' : 'Log In'}
          icon={ArrowRight}
          iconPosition="right"
          className="mt-4 rounded-2xl py-5"
          onPress={handleLogin}
          disabled={loading}
        />
      </View>

      <View className="mt-16 mb-8 items-center">
        <Pressable onPress={() => router.push('/(auth)/signup')} disabled={loading}>
          <Text className="text-text-secondary font-inter">Don't have an account? <Text className="text-accent font-inter-bold">Sign Up</Text></Text>
        </Pressable>
      </View>

      {dialog ? (
        <ThemedDialog
          visible={Boolean(dialog)}
          title={dialog.title}
          message={dialog.message}
          tone={dialog.tone}
          icon={dialog.icon}
          primaryAction={{ label: dialog.actionLabel, onPress: dialog.onAction }}
          dismissible={dialog.dismissible ?? true}
          onRequestClose={closeDialog}
        />
      ) : null}
    </ScreenContainer>
  );
}
