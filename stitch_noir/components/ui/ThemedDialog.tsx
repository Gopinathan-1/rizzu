import React from 'react';
import { ActivityIndicator, Modal, Pressable, View } from 'react-native';
import { Text } from './Text';
import { useAppStore } from '@/store/useAppStore';
import { CHOCOLATE_TRUFFLE_DARK, CHOCOLATE_TRUFFLE_LIGHT } from '@/theme/palette';

type DialogTone = 'info' | 'success' | 'danger';
type DialogActionTone = 'neutral' | 'primary' | 'danger';

export type ThemedDialogAction = {
  label: string;
  onPress: () => void;
  tone?: DialogActionTone;
  loading?: boolean;
  disabled?: boolean;
};

type IconComponent = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

type ThemedDialogProps = {
  visible: boolean;
  title: string;
  message?: string;
  tone?: DialogTone;
  icon?: IconComponent;
  primaryAction: ThemedDialogAction;
  secondaryAction?: ThemedDialogAction;
  dismissible?: boolean;
  onRequestClose?: () => void;
};

export function ThemedDialog({
  visible,
  title,
  message,
  tone = 'info',
  icon: Icon,
  primaryAction,
  secondaryAction,
  dismissible = true,
  onRequestClose,
}: ThemedDialogProps) {
  const themeMode = useAppStore((state) => state.themeMode);
  const isLight = themeMode === 'light';
  const palette = isLight ? CHOCOLATE_TRUFFLE_LIGHT : CHOCOLATE_TRUFFLE_DARK;

  const iconColor = tone === 'danger' ? palette.danger : palette.accent;
  const iconBackground = palette.accentSubtle;
  const primaryTone = primaryAction.tone ?? (tone === 'danger' ? 'danger' : 'primary');

  const primaryStyles =
    primaryTone === 'danger'
      ? {
          backgroundColor: isLight ? 'rgba(192, 88, 0, 0.14)' : 'rgba(224, 96, 32, 0.16)',
          textColor: palette.danger,
        }
      : {
          backgroundColor: palette.accent,
          textColor: palette.bgPrimary,
        };

  const secondaryStyles =
    secondaryAction?.tone === 'danger'
      ? {
          backgroundColor: isLight ? 'rgba(192, 88, 0, 0.08)' : 'rgba(224, 96, 32, 0.12)',
          textColor: palette.danger,
        }
      : {
          backgroundColor: palette.bgSurface,
          textColor: palette.textPrimary,
        };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
      <Pressable
        className="flex-1 items-center justify-center bg-black/55 px-6"
        onPress={dismissible ? onRequestClose : undefined}
      >
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
          <View className="mb-5 h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: iconBackground }}>
            {Icon ? <Icon size={26} color={iconColor} strokeWidth={2.1} /> : null}
          </View>

          <Text variant="headline" className="mb-2">
            {title}
          </Text>
          {message ? (
            <Text className="mb-6 text-base text-on-surface-variant">
              {message}
            </Text>
          ) : null}

          <View className="flex-row gap-3">
            {secondaryAction ? (
              <Pressable
                onPress={secondaryAction.onPress}
                disabled={secondaryAction.disabled || secondaryAction.loading}
                className="flex-1 items-center justify-center rounded-full px-4 py-4 active:opacity-80"
                style={{ backgroundColor: secondaryStyles.backgroundColor }}
              >
                {secondaryAction.loading ? (
                  <ActivityIndicator size="small" color={secondaryStyles.textColor} />
                ) : (
                  <Text weight="semibold" style={{ color: secondaryStyles.textColor }}>
                    {secondaryAction.label}
                  </Text>
                )}
              </Pressable>
            ) : null}

            <Pressable
              onPress={primaryAction.onPress}
              disabled={primaryAction.disabled || primaryAction.loading}
              className="flex-1 items-center justify-center rounded-full px-4 py-4 active:opacity-80"
              style={{ backgroundColor: primaryStyles.backgroundColor }}
            >
              {primaryAction.loading ? (
                <ActivityIndicator size="small" color={primaryStyles.textColor} />
              ) : (
                <Text weight="bold" style={{ color: primaryStyles.textColor }}>
                  {primaryAction.label}
                </Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}