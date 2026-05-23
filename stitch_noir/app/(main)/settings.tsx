import React, { useEffect, useState } from 'react';
import { View, Pressable, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { useAppStore } from '@/store/useAppStore';
import { authService } from '@/services/auth';
import { ChevronLeft, User, LogOut, ChevronRight } from 'lucide-react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const user = useAppStore((state) => state.user);
  const themeMode = useAppStore((state) => state.themeMode);
  const isLight = themeMode === 'light';
  const setThemeMode = useAppStore((state) => state.setThemeMode);
  const setUser = useAppStore((state) => state.setUser);
  const logout = useAppStore((state) => state.logout);
  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFullName(user?.full_name ?? '');
  }, [user?.full_name]);

  const performLogout = async () => {
    const { error } = await authService.logout();
    if (error) {
      Alert.alert('Error', 'Failed to logout');
      return;
    }
    logout();
    router.replace('/(auth)/login');
  };

  const handleLogout = () => {
    Alert.alert('Log out?', 'You will need to sign in again to access your workspace.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => void performLogout() },
    ]);
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert('Missing name', 'Please enter your full name.');
      return;
    }

    setSaving(true);
    const { error } = await authService.updateProfile(fullName.trim());
    setSaving(false);

    if (error) {
      Alert.alert('Error', 'Could not update profile');
      return;
    }

    // update local store so UI updates immediately
    try {
      if (user?.id) {
        setUser({ ...user, full_name: fullName.trim() });
      }
    } catch (e) {
      // ignore
    }

    Alert.alert('Saved', 'Profile updated successfully.');
  };

  const MenuItem = ({ icon: Icon, label, value, onPress, color }: any) => (
    <Pressable onPress={onPress} className="flex-row items-center justify-between py-5 border-b border-outline-variant/30">
      <View className="flex-row items-center">
        <View className="w-10 h-10 rounded-full bg-surface-container-high items-center justify-center mr-4 border border-outline-variant/50">
          <Icon size={20} color={color ?? (isLight ? '#000000' : '#FFFFFF')} />
        </View>
        <Text weight="semibold" size="lg">{label}</Text>
      </View>
      <View className="flex-row items-center">
        {value ? <Text className="text-outline mr-2">{value}</Text> : null}
        <ChevronRight size={20} color={isLight ? '#000000' : '#FFFFFF'} />
      </View>
    </Pressable>
  );

  return (
    <ScreenContainer scrollable={false}>
      <View className="flex-row items-center py-4">
        <Pressable onPress={() => router.back()}>
          <ChevronLeft size={24} color={isLight ? '#000000' : '#FFFFFF'} />
        </Pressable>
        <Text variant="headline" className="ml-4">Settings</Text>
      </View>

      <Card className="mt-6 p-6 flex-row items-center bg-surface-container border border-outline-variant">
        <View className="w-16 h-16 rounded-full bg-background mr-4 border border-outline-variant overflow-hidden items-center justify-center">
          <User size={28} color={isLight ? '#000000' : '#FFFFFF'} />
        </View>
        <View className="flex-1">
          <Text weight="bold" size="xl">{user?.full_name ?? 'Your Profile'}</Text>
          <Text className="text-outline text-xs font-bold tracking-widest uppercase">{user?.email ?? 'No email found'}</Text>
        </View>
      </Card>

      {/* Removed standalone Edit Profile and Upgrade card per settings cleanup */}

      <View className="mt-10">
        <Text variant="label" className="mb-2 tracking-[0.18em]">Account</Text>
        <Card className="p-5 bg-surface-container border border-outline-variant mb-4 rounded-[28px]">
          <Text weight="bold" size="sm" className="mb-3 uppercase tracking-widest text-on-surface-variant">Personal Information</Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Full name"
            placeholderTextColor={isLight ? '#000000' : '#FFFFFF'}
            className="bg-surface-container-lowest border border-outline-variant rounded-2xl px-4 py-3 text-on-surface"
          />
          <Button
            label={saving ? 'Saving...' : 'Save Profile'}
            className="mt-4 rounded-full py-3"
            onPress={handleSaveProfile}
            disabled={saving}
          />
        </Card>

        <Text variant="label" className="mb-2 tracking-[0.18em]">Appearance</Text>
        <Card className="p-5 bg-surface-container border border-outline-variant mb-4 rounded-[28px]">
          <Text weight="bold" size="sm" className="mb-3 uppercase tracking-widest text-on-surface-variant">Theme</Text>
          <View className="flex-row gap-3">
            <Pressable
              onPress={() => setThemeMode('light')}
              style={{
                flex: 1,
                borderRadius: 999,
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderWidth: 1,
                backgroundColor: themeMode === 'light' ? '#F3F3F3' : 'transparent',
                borderColor: themeMode === 'light' ? '#E5E7EB' : 'rgba(0,0,0,0.06)'
              }}
            >
              <Text weight="semibold" style={{ color: themeMode === 'light' ? '#1A1A1A' : '#6B7280' }}>
                Light
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setThemeMode('dark')}
              style={{
                flex: 1,
                borderRadius: 999,
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderWidth: 1,
                backgroundColor: themeMode === 'dark' ? '#1A1A1A' : 'transparent',
                borderColor: themeMode === 'dark' ? '#111111' : 'rgba(0,0,0,0.06)'
              }}
            >
              <Text weight="semibold" style={{ color: themeMode === 'dark' ? '#FFFFFF' : '#6B7280' }}>
                Dark
              </Text>
            </Pressable>
          </View>
        </Card>
      </View>

      <View className="mt-8">
        <Text variant="label" className="mb-2 tracking-[0.18em]">Support</Text>
        <MenuItem icon={LogOut} label="Log Out" onPress={handleLogout} />
      </View>

      {/* Branding removed per request */}
    </ScreenContainer>
  );
}
