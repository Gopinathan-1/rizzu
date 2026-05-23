import type { ComponentType, ReactNode } from 'react';
import { View } from 'react-native';
import { useAppStore } from '@/store/useAppStore';
import { Text } from './Text';

type EmptyStateProps = {
  title: string;
  message: string;
  icon?: ComponentType<{ size?: number; color?: string }>;
  action?: ReactNode;
};

export function EmptyState({ title, message, icon: Icon, action }: EmptyStateProps) {
  const themeMode = useAppStore((state) => state.themeMode);
  const isLight = themeMode === 'light';

  return (
    <View className="items-center justify-center rounded-[28px] border border-outline-variant bg-surface-container px-6 py-10">
      <View className="mb-5 h-16 w-16 items-center justify-center rounded-full border border-outline-variant bg-background">
        {Icon ? <Icon size={28} color={isLight ? '#000000' : '#FFFFFF'} /> : null}
      </View>
      <Text variant="headline" className="text-center text-[22px] leading-7">
        {title}
      </Text>
      <Text className="mt-2 max-w-[300px] text-center text-on-surface-variant leading-6">
        {message}
      </Text>
      {action ? <View className="mt-6">{action}</View> : null}
    </View>
  );
}
