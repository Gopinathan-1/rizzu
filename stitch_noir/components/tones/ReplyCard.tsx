import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { CopyButton } from './CopyButton';

interface ReplyCardProps {
  text: string;
}

export function ReplyCard({ text }: ReplyCardProps) {
  return (
    <Pressable className="self-start max-w-[84%] rounded-[28px] border border-border bg-ai-bubble active:scale-[0.99] hover:-translate-y-0.5 transition-all duration-200">
      <View className="flex-row items-center gap-3 px-4 py-3.5">
        <Text numberOfLines={1} className="text-[14px] leading-5 text-text-primary tracking-tight">
          {text}
        </Text>
        <CopyButton value={text} />
      </View>
    </Pressable>
  );
}
