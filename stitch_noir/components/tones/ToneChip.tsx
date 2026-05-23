import { Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/ui/Text';
import { CHOCOLATE_TRUFFLE_DARK, CHOCOLATE_TRUFFLE_LIGHT } from '@/theme/palette';

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
          colors={[CHOCOLATE_TRUFFLE_LIGHT.accentSubtle, CHOCOLATE_TRUFFLE_DARK.accentSubtle]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          className="px-3.5 py-2 rounded-full border border-border"
          style={{ shadowColor: CHOCOLATE_TRUFFLE_DARK.accentGlow }}
        >
          <View>
            <Text weight="bold" className="text-accent tracking-tight">
              {label}
            </Text>
          </View>
        </LinearGradient>
      ) : (
        <View className="px-3.5 py-2 rounded-full bg-bg-elevated border border-border" style={{ shadowColor: CHOCOLATE_TRUFFLE_DARK.accentGlow }}>
          <Text size="sm" className="text-text-secondary tracking-tight">{label}</Text>
        </View>
      )}
    </Pressable>
  );
}
