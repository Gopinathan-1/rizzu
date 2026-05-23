import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/ui/Text';
import { ToneChip } from './ToneChip';
import { ReplyCard } from './ReplyCard';
import type { ConversationAnalysisResult } from '@/services/conversationAnalysis';

interface ToneAnalysisPanelProps {
  analysis: ConversationAnalysisResult;
}

export function ToneAnalysisPanel({ analysis }: ToneAnalysisPanelProps) {
  const chips = useMemo(() => analysis.replyStyles.slice(0, 3), [analysis.replyStyles]);
  const [activeChip, setActiveChip] = useState(chips[0] ?? 'Casual');

  useEffect(() => {
    setActiveChip(chips[0] ?? 'Casual');
  }, [chips]);

  const heading = useMemo(() => {
    const mood = analysis.mood.trim();
    return mood || 'Friendly';
  }, [analysis.mood]);

  return (
    <View className="gap-5">
      <View className="relative overflow-hidden rounded-[30px] px-1 py-2">
        <View className="absolute -left-8 top-0 h-32 w-32 rounded-full bg-accent/10 blur-3xl" />
        <View className="absolute -right-10 top-2 h-32 w-32 rounded-full bg-accent/10 blur-3xl" />

        <View className="relative gap-4">
          <LinearGradient
            colors={['rgba(160,118,42,0.96)', 'rgba(160,118,42,0.82)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            className="self-start rounded-full px-4 py-2 shadow-lg shadow-black/10"
          >
            <Text size="sm" weight="bold" className="text-background tracking-tight">
              {analysis.tone}
            </Text>
          </LinearGradient>

          <View className="gap-2">
            <Text variant="headline" className="text-[28px] leading-8 tracking-tight text-text-primary">
              {heading}
            </Text>
            <Text className="max-w-[340px] text-[15px] leading-6 text-text-secondary">
              Warm, approachable, and concise responses.
            </Text>
          </View>

          <View className="flex-row flex-wrap gap-2.5 pt-2">
            {chips.map((chip) => (
              <ToneChip
                key={chip}
                label={chip}
                active={chip === activeChip}
                onPress={setActiveChip}
              />
            ))}
          </View>
        </View>
      </View>

      <View className="gap-3">
        <Text size="xs" className="pl-1 uppercase tracking-[0.35em] text-text-secondary">
          Suggested replies
        </Text>

        <View className="gap-3">
          {(analysis.replies?.length ? analysis.replies : ['Hey! What’s up?','Hey you! How’s it going?','Hi! What are you up to?'])
            .slice(0, 3)
            .map((reply) => (
              <ReplyCard key={reply} text={reply} />
            ))}
        </View>
      </View>
    </View>
  );
}
