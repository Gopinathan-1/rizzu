import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Copy } from 'lucide-react-native';
import { Text } from '@/components/ui/Text';

interface CopyButtonProps {
  value: string;
  onCopied?: (value: string) => void;
}

export function CopyButton({ value, onCopied }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = () => {
    Animated.sequence([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.delay(850),
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(value);
    setCopied(true);
    onCopied?.(value);
    showToast();

    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
    }

    hideTimer.current = setTimeout(() => setCopied(false), 1100);
  };

  useEffect(() => {
    return () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }
    };
  }, []);

  return (
    <View className="relative items-end justify-center">
      <Pressable
        onPress={handleCopy}
        className="flex-row items-center justify-center rounded-full bg-white/5 p-2 border border-white/10 opacity-85 active:scale-[0.96] transition-all duration-200 hover:opacity-100 hover:bg-white/10 hover:shadow-md hover:shadow-violet-500/10"
      >
        <Copy size={15} color="#efe9ff" />
      </Pressable>

      <Animated.View
        pointerEvents="none"
        style={{
          opacity: toastOpacity,
          transform: [
            {
              translateY: toastOpacity.interpolate({
                inputRange: [0, 1],
                outputRange: [8, 0],
              }),
            },
          ],
        }}
        className="absolute -top-8 right-0"
      >
        <View className="rounded-full border border-emerald-400/25 bg-emerald-400/15 px-3 py-1.5 shadow-lg shadow-emerald-500/20">
          <Text size="xs" weight="bold" className="text-emerald-100">
            {copied ? 'Copied!' : 'Copy'}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}
