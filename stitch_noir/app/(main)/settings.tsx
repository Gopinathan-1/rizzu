import React, { useEffect, useState } from 'react';
import { View, Pressable, Alert, TextInput, Modal, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { useAppStore } from '@/store/useAppStore';
import { authService } from '@/services/auth';
import { ChevronLeft, User, LogOut, ChevronRight } from 'lucide-react-native';
import { CHOCOLATE_TRUFFLE_DARK, CHOCOLATE_TRUFFLE_LIGHT } from '@/theme/palette';

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
  const [logoutConfirmVisible, setLogoutConfirmVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    setFullName(user?.full_name ?? '');
  }, [user?.full_name]);

  const performLogout = async () => {
    setLoggingOut(true);
    const { error } = await authService.logout();
    setLoggingOut(false);
    if (error) {
      Alert.alert('Error', 'Failed to logout');
      return;
    }
    logout();
    router.replace('/(auth)/login');
  };

  const handleLogout = () => {
    setLogoutConfirmVisible(true);
  };

  const cancelLogout = () => {
    if (loggingOut) {
      return;
    }

    setLogoutConfirmVisible(false);
  };

  const confirmLogout = () => {
    setLogoutConfirmVisible(false);
    void performLogout();
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
          <Icon size={20} color={color ?? (isLight ? CHOCOLATE_TRUFFLE_LIGHT.textPrimary : CHOCOLATE_TRUFFLE_DARK.textPrimary)} />
        </View>
        <Text weight="semibold" size="lg">{label}</Text>
      </View>
      <View className="flex-row items-center">
        {value ? <Text className="text-outline mr-2">{value}</Text> : null}
        <ChevronRight size={20} color={isLight ? CHOCOLATE_TRUFFLE_LIGHT.textPrimary : CHOCOLATE_TRUFFLE_DARK.textPrimary} />
      </View>
    </Pressable>
  );

  return (
    <ScreenContainer scrollable={false}>
      <View className="flex-row items-center py-4">
        <Pressable onPress={() => router.back()}>
          <ChevronLeft size={24} color={isLight ? CHOCOLATE_TRUFFLE_LIGHT.textPrimary : CHOCOLATE_TRUFFLE_DARK.textPrimary} />
        </Pressable>
        <Text variant="headline" className="ml-4">Settings</Text>
      </View>

      <Card className="mt-6 p-6 flex-row items-center bg-surface-container border border-outline-variant">
        <View className="w-16 h-16 rounded-full bg-background mr-4 border border-outline-variant overflow-hidden items-center justify-center">
          <User size={28} color={isLight ? CHOCOLATE_TRUFFLE_LIGHT.textPrimary : CHOCOLATE_TRUFFLE_DARK.textPrimary} />
        </View>
        <View className="flex-1">
          <Text weight="bold" size="xl">{user?.full_name ?? 'Your Profile'}</Text>
          <Text className="text-xs font-bold tracking-widest uppercase" style={{ color: isLight ? CHOCOLATE_TRUFFLE_LIGHT.textSecondary : CHOCOLATE_TRUFFLE_DARK.textSecondary }}>{user?.email ?? 'No email found'}</Text>
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
            placeholderTextColor={isLight ? CHOCOLATE_TRUFFLE_LIGHT.textSecondary : CHOCOLATE_TRUFFLE_DARK.textSecondary}
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
                backgroundColor: themeMode === 'light' ? CHOCOLATE_TRUFFLE_LIGHT.accent : CHOCOLATE_TRUFFLE_DARK.bgElevated,
                borderColor: themeMode === 'light' ? CHOCOLATE_TRUFFLE_LIGHT.border : CHOCOLATE_TRUFFLE_DARK.border
              }}
            >
              <Text weight="semibold" style={{ color: themeMode === 'light' ? CHOCOLATE_TRUFFLE_LIGHT.bgPrimary : CHOCOLATE_TRUFFLE_DARK.textSecondary }}>
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
                backgroundColor: themeMode === 'dark' ? CHOCOLATE_TRUFFLE_DARK.accent : CHOCOLATE_TRUFFLE_LIGHT.bgElevated,
                borderColor: themeMode === 'dark' ? CHOCOLATE_TRUFFLE_DARK.border : CHOCOLATE_TRUFFLE_LIGHT.border
              }}
            >
              <Text weight="semibold" style={{ color: themeMode === 'dark' ? CHOCOLATE_TRUFFLE_DARK.bgPrimary : CHOCOLATE_TRUFFLE_LIGHT.textSecondary }}>
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

      <Modal
        visible={logoutConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={cancelLogout}
      >
        <Pressable className="flex-1 items-center justify-center bg-black/55 px-6" onPress={cancelLogout}>
          <Pressable
            onPress={() => undefined}
            className="w-full max-w-[420px] overflow-hidden rounded-[32px] border border-outline-variant bg-surface-container p-6"
            style={{
              shadowColor: '#000',
              shadowOpacity: 0.24,
              shadowRadius: 24,
              shadowOffset: { width: 0, height: 16 },
              elevation: 18,
            }}
          >
            <View className="mb-5 h-14 w-14 items-center justify-center rounded-full bg-[rgba(192,88,0,0.12)]">
              <LogOut size={26} color={isLight ? CHOCOLATE_TRUFFLE_LIGHT.danger : CHOCOLATE_TRUFFLE_DARK.danger} />
            </View>

            <Text variant="headline" className="mb-2">
              Log out?
            </Text>
            <Text className="mb-6 text-base text-on-surface-variant">
              You will need to sign in again to access your workspace.
            </Text>

            <View className="flex-row gap-3">
              <Pressable
                onPress={cancelLogout}
                disabled={loggingOut}
                className="flex-1 items-center justify-center rounded-full border border-outline-variant bg-surface px-4 py-4 active:opacity-80"
              >
                <Text weight="semibold">Cancel</Text>
              </Pressable>

              <Pressable
                onPress={confirmLogout}
                disabled={loggingOut}
                className="flex-1 flex-row items-center justify-center rounded-full bg-[rgba(192,88,0,0.14)] px-4 py-4 active:opacity-80"
              >
                {loggingOut ? (
                  <ActivityIndicator size="small" color={isLight ? CHOCOLATE_TRUFFLE_LIGHT.danger : CHOCOLATE_TRUFFLE_DARK.danger} />
                ) : (
                  <Text weight="bold" style={{ color: isLight ? CHOCOLATE_TRUFFLE_LIGHT.danger : CHOCOLATE_TRUFFLE_DARK.danger }}>
                    Log out
                  </Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Branding removed per request */}
    </ScreenContainer>
  );
}
