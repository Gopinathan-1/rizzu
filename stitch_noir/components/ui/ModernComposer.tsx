import { ReactNode, useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

type ModernComposerProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  toolbarLeft?: ReactNode;
  toolbarCenter?: ReactNode;
  toolbarRight?: ReactNode;
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
  minHeight = 76,
  maxHeight = 128,
  containerClassName = 'w-full rounded-[32px] border border-outline-variant bg-surface-container px-4 p-5 pb-1.5 shadow-lg shadow-black/20',
  inputClassName = 'px-1 py-0 text-base text-on-surface',
  inputProps,
}: ModernComposerProps) {
  const [inputHeight, setInputHeight] = useState(minHeight);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className={containerClassName}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={isFocused ? '' : placeholder}
        placeholderTextColor="#8f879b"
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
        <View className="mt-2 flex-row items-center gap-3">
          <View className="flex-row items-center gap-3">{toolbarLeft}</View>
          <View className="flex-1 items-center">{toolbarCenter}</View>
          <View className="flex-row items-center gap-3">{toolbarRight}</View>
        </View>
      ) : null}
    </View>
  );
}