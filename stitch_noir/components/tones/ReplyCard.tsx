import { Pressable, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/ui/Text';
import { CopyButton } from './CopyButton';

interface ReplyCardProps {
  text: string;
}

export function ReplyCard({ text }: ReplyCardProps) {
  return (
    <Pressable className="self-start max-w-[84%] rounded-[28px] active:scale-[0.99] hover:-translate-y-0.5 transition-all duration-200">
      <BlurView intensity={22} tint="dark" className="overflow-hidden rounded-[28px]">
        <LinearGradient
          colors={['rgba(255,255,255,0.07)', 'rgba(255,255,255,0.03)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="border border-white/8 shadow-lg shadow-black/10"
        >
          <View className="flex-row items-center gap-3 px-4 py-3.5">
            <Text numberOfLines={1} className="text-[14px] leading-5 text-white/95 tracking-tight">
              {text}
            </Text>
            <CopyButton value={text} />
          </View>
        </LinearGradient>
      </BlurView>
    </Pressable>
  );
}
