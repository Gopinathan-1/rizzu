import { useEffect, useRef, useState } from 'react';
import { Pressable } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Check, Copy } from 'lucide-react-native';
import { useAppStore } from '@/store/useAppStore';

interface CopyButtonProps {
  value: string;
  onCopied?: (value: string) => void;
}

export function CopyButton({ value, onCopied }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(value);
    setCopied(true);
    onCopied?.(value);

    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
    }

    hideTimer.current = setTimeout(() => setCopied(false), 3000);
  };

  useEffect(() => {
    return () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }
    };
  }, []);

  return (
    <Pressable
      onPress={handleCopy}
      className="items-center justify-center rounded-full bg-bg-elevated p-2 border border-border opacity-85 active:scale-[0.96] transition-all duration-200 hover:opacity-100 hover:bg-bg-elevated"
    >
      {(() => {
        const themeMode = useAppStore((state) => state.themeMode);
        const isLight = themeMode === 'light';
        return copied ? <Check size={15} color={isLight ? '#000000' : '#FFFFFF'} /> : <Copy size={15} color={isLight ? '#000000' : '#FFFFFF'} />;
      })()}
    </Pressable>
  );
}
