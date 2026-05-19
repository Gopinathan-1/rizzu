import { useEffect, useRef, useState } from 'react';
import { Pressable } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Check, Copy } from 'lucide-react-native';

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
      className="items-center justify-center rounded-full bg-white/5 p-2 border border-white/10 opacity-85 active:scale-[0.96] transition-all duration-200 hover:opacity-100 hover:bg-white/10 hover:shadow-md hover:shadow-violet-500/10"
    >
      {copied ? <Check size={15} color="#86efac" /> : <Copy size={15} color="#efe9ff" />}
    </Pressable>
  );
}
