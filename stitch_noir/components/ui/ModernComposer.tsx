import { ReactNode, useState } from 'react';
import { Image, Pressable, Text as RNText, TextInput, View, type ImageSourcePropType, type TextInputProps } from 'react-native';
import { useAppStore } from '@/store/useAppStore';
import { CHOCOLATE_TRUFFLE_DARK, CHOCOLATE_TRUFFLE_LIGHT } from '@/theme/palette';

type ModernComposerProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  toolbarLeft?: ReactNode;
  toolbarCenter?: ReactNode;
  toolbarRight?: ReactNode;
  attachmentPreview?: ImageSourcePropType | null;
  onRemoveAttachment?: () => void;
  minHeight?: number;
  maxHeight?: number;
  containerClassName?: string;
  inputClassName?: string;
  inputProps?: Omit<TextInputProps, 'multiline' | 'value' | 'onChangeText' | 'placeholder'>;
};

export function ModernComposer({
  value,
  onChangeText,
  placeholder,
  toolbarLeft,
  toolbarCenter,
  toolbarRight,
  attachmentPreview,
  onRemoveAttachment,
  minHeight = 76,
  maxHeight = 128,
  containerClassName = 'w-full rounded-[32px] border border-border bg-surface px-4 p-4 pb-2 shadow-lg',
  inputClassName = 'px-1 py-0 text-base text-on-surface',
  inputProps,
}: ModernComposerProps) {
  const [inputHeight, setInputHeight] = useState(minHeight);
  const [isFocused, setIsFocused] = useState(false);
  const themeMode = useAppStore((state) => state.themeMode);
  const placeholderColor = themeMode === 'light' ? CHOCOLATE_TRUFFLE_LIGHT.textSecondary : CHOCOLATE_TRUFFLE_DARK.textSecondary;

  return (
    <View className={containerClassName}>
      {attachmentPreview ? (
        <View className="mb-3 overflow-hidden rounded-[24px] border border-border bg-bg-elevated">
          <View className="flex-row items-center justify-between px-3 py-2">
            <RNText style={{ color: themeMode === 'light' ? CHOCOLATE_TRUFFLE_LIGHT.textSecondary : CHOCOLATE_TRUFFLE_DARK.textSecondary, fontSize: 12, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' }}>
              Attached image
            </RNText>
            {onRemoveAttachment ? (
              <Pressable onPress={onRemoveAttachment} hitSlop={8} className="rounded-full border border-border bg-background px-2 py-1">
                <RNText style={{ color: placeholderColor, fontSize: 12, fontWeight: '700' }}>Remove</RNText>
              </Pressable>
            ) : null}
          </View>
          <Image source={attachmentPreview} className="h-44 w-full" resizeMode="cover" />
        </View>
      ) : null}

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={isFocused ? '' : placeholder}
        placeholderTextColor={placeholderColor}
        multiline
        textAlignVertical="top"
        scrollEnabled={inputHeight >= maxHeight}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onContentSizeChange={(event) => {
          const nextHeight = Math.ceil(event.nativeEvent.contentSize.height);
          setInputHeight(Math.max(minHeight, Math.min(maxHeight, nextHeight)));
        }}
        style={{ minHeight, height: inputHeight, maxHeight }}
        className={inputClassName}
        {...inputProps}
      />

      {(toolbarLeft || toolbarCenter || toolbarRight) ? (
        <View className="mt-3 flex-row items-center gap-3">
          <View className="flex-row items-center gap-3">{toolbarLeft}</View>
          <View className="flex-1 items-center">{toolbarCenter}</View>
          <View className="flex-row items-center gap-3">{toolbarRight}</View>
        </View>
      ) : null}
    </View>
  );
}