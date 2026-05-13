import { Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/ui/Text';

interface ToneChipProps {
  label: string;
  active?: boolean;
  onPress: (label: string) => void;
}

export function ToneChip({ label, active = false, onPress }: ToneChipProps) {
  return (
    <Pressable
      onPress={() => onPress(label)}
      className="overflow-hidden rounded-full active:scale-[0.98] transition-all duration-200"
    >
      {active ? (
        <LinearGradient
          colors={['rgba(139, 92, 246, 0.98)', 'rgba(59, 130, 246, 0.92)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          className="px-3.5 py-2 rounded-full border border-white/15 shadow-lg shadow-violet-500/20"
        >
          <View>
            <Text weight="bold" className="text-white tracking-tight">
              {label}
            </Text>
          </View>
        </LinearGradient>
      ) : (
        <View className="px-3.5 py-2 rounded-full bg-white/4 border border-white/8 shadow-sm shadow-black/10 hover:bg-white/6">
          <Text size="sm" className="text-white/70 tracking-tight">{label}</Text>
        </View>
      )}
    </Pressable>
  );
}
