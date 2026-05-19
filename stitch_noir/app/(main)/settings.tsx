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
  const setUser = useAppStore((state) => state.setUser);
  const logout = useAppStore((state) => state.logout);
  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFullName(user?.full_name ?? '');
  }, [user?.full_name]);

  const handleLogout = async () => {
    const { error } = await authService.logout();
    if (error) {
      Alert.alert('Error', 'Failed to logout');
      return;
    }
    logout();
    router.replace('/(auth)/login');
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
      setUser({ ...(user ?? {}), full_name: fullName.trim() });
    } catch (e) {
      // ignore
    }

    Alert.alert('Saved', 'Profile updated successfully.');
  };

  const MenuItem = ({ icon: Icon, label, value, onPress, color = '#e8e0ee' }: any) => (
    <Pressable onPress={onPress} className="flex-row items-center justify-between py-5 border-b border-outline-variant/30">
      <View className="flex-row items-center">
        <View className="w-10 h-10 rounded-full bg-surface-container-high items-center justify-center mr-4">
          <Icon size={20} color={color} />
        </View>
        <Text weight="semibold" size="lg">{label}</Text>
      </View>
      <View className="flex-row items-center">
        {value ? <Text className="text-outline mr-2">{value}</Text> : null}
        <ChevronRight size={20} color="#4a4455" />
      </View>
    </Pressable>
  );

  return (
    <ScreenContainer scrollable={false}>
      <View className="flex-row items-center py-4">
        <Pressable onPress={() => router.back()}>
          <ChevronLeft size={24} color="#e8e0ee" />
        </Pressable>
        <Text variant="headline" className="ml-4">Settings</Text>
      </View>

      <Card className="mt-6 p-6 flex-row items-center bg-primary-container/10 border border-primary/20">
        <View className="w-16 h-16 rounded-full bg-slate-800 mr-4 border-2 border-primary/40 overflow-hidden items-center justify-center">
          <User size={28} color="#d3bbff" />
        </View>
        <View className="flex-1">
          <Text weight="bold" size="xl">{user?.full_name ?? 'Your Profile'}</Text>
          <Text className="text-outline text-xs font-bold tracking-widest uppercase">{user?.email ?? 'No email found'}</Text>
        </View>
      </Card>

      {/* Removed standalone Edit Profile and Upgrade card per settings cleanup */}

      <View className="mt-10">
        <Text variant="label" className="mb-2">Account</Text>
        <Card className="p-4 bg-surface-container border border-outline-variant mb-4">
          <Text weight="bold" size="sm" className="mb-2">Personal Information</Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Full name"
            placeholderTextColor="#958da1"
            className="bg-surface-container-lowest border border-outline-variant rounded-2xl px-4 py-3 text-on-surface"
          />
          <Button
            label={saving ? 'Saving...' : 'Save Profile'}
            className="mt-3 rounded-2xl py-3"
            onPress={handleSaveProfile}
            disabled={saving}
          />
        </Card>
      </View>

      <View className="mt-8">
        <Text variant="label" className="mb-2">Support</Text>
        <MenuItem icon={LogOut} label="Log Out" color="#ffb2b7" onPress={handleLogout} />
      </View>

      {/* Branding removed per request */}
    </ScreenContainer>
  );
}
