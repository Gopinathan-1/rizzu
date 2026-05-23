import React, { useEffect, useState } from 'react';
import { View, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { fetchHistoryRecords, HistoryRecord } from '@/services/appData';
import { ChevronLeft, Copy, History } from 'lucide-react-native';
import { useAppStore } from '@/store/useAppStore';

const HistoryItemContent = ({ item }: { item: HistoryRecord }) => {
  if (!item.content) return null;
  const themeMode = useAppStore((state) => state.themeMode);
  const isLight = themeMode === 'light';

  try {
    const data = JSON.parse(item.content);

    if (item.type === 'analysis') {
      return (
        <View className="gap-2">
          <Text size="sm" className="text-outline">Conversation:</Text>
          <Text className="text-on-surface text-sm italic" numberOfLines={3}>{data.conversation || data.extractedText}</Text>
          <View className="flex-row items-center gap-2 mt-2">
            <View className="bg-secondary-container px-2 py-0.5 rounded">
              <Text size="xs" weight="bold" className="text-on-secondary-container">{data.analysis?.tone || data.tone}</Text>
            </View>
            <Text className="text-on-surface-variant text-xs">{data.analysis?.mood || data.mood}</Text>
          </View>
        </View>
      );
    }

    if (item.type === 'reply') {
      return (
        <View className="gap-2">
          <Text size="sm" className="text-outline">Context:</Text>
          <Text className="text-on-surface text-sm italic" numberOfLines={2}>{data.context}</Text>
          <View className="flex-row items-center gap-2 mt-1">
            <View className="bg-primary-container px-2 py-0.5 rounded">
              <Text size="xs" weight="bold" className="text-on-primary-container">{data.tone}</Text>
            </View>
            <Text className="text-outline text-xs">{data.replies?.length} suggestions</Text>
          </View>
        </View>
      );
    }

    if (item.type === 'bio' || item.type === 'opener') {
      return (
        <View className="gap-2">
          <Text size="sm" className="text-outline">{item.type === 'bio' ? 'Your Vibe:' : 'Their Profile:'}</Text>
          <Text className="text-on-surface text-sm italic" numberOfLines={2}>{data.input}</Text>
          <View className="flex-row items-center gap-2 mt-1">
            <View className="bg-tertiary-container px-2 py-0.5 rounded">
              <Text size="xs" weight="bold" className="text-on-tertiary-container">{data.tone}</Text>
            </View>
            <Text className="text-outline text-xs">{data.results?.length} suggestions</Text>
          </View>
        </View>
      );
    }

    return <Text className="text-on-surface-variant">{item.content}</Text>;
  } catch (e) {
    return <Text className="text-on-surface-variant">{item.content}</Text>;
  }
};

const ExpandedHistoryItem = ({ item, onCopy }: { item: HistoryRecord; onCopy: (text: string) => void }) => {
  if (!item.content) return null;

  try {
    const data = JSON.parse(item.content);
    const themeMode = useAppStore((state) => state.themeMode);
    const isLight = themeMode === 'light';

    return (
      <View className="mt-4 pt-4 border-t border-outline-variant/30 gap-4">
        {item.type === 'analysis' && (
          <View className="gap-4">
            <View>
              <Text size="xs" weight="bold" className="text-outline uppercase mb-2">Full Input</Text>
              <Text className="text-on-surface leading-relaxed bg-surface-container-high p-3 rounded-xl">{data.conversation || data.extractedText}</Text>
            </View>
            <View>
              <Text size="xs" weight="bold" className="text-outline uppercase mb-2">Analysis Results</Text>
              <Text className="text-primary font-bold">Tone: {data.analysis?.tone || data.tone}</Text>
              <Text className="text-on-surface-variant mt-1">Mood: {data.analysis?.mood || data.mood}</Text>
              <View className="flex-row flex-wrap gap-2 mt-3">
                {(data.analysis?.replyStyles || data.replies || []).map((style: string) => (
                  <View key={style} className="bg-surface-container-highest px-3 py-1.5 rounded-lg border border-outline-variant">
                    <Text size="xs" className="text-on-surface-variant">{style}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {(item.type === 'reply' || item.type === 'bio' || item.type === 'opener') && (
          <View className="gap-4">
            <View>
              <Text size="xs" weight="bold" className="text-outline uppercase mb-2">Suggestions</Text>
              <View className="gap-3">
                {(data.replies || data.results || []).map((result: string, idx: number) => (
                  <Pressable 
                    key={idx} 
                    className="bg-surface-container-high p-4 rounded-xl border border-outline-variant/50"
                    onPress={() => onCopy(result)}
                  >
                    <Text className="text-on-surface leading-relaxed">{result}</Text>
                      <View className="flex-row justify-end mt-2">
                        <Copy size={14} color={isLight ? '#000000' : '#FFFFFF'} />
                      </View>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        )}

        <Pressable className="mt-2 flex-row items-center justify-center gap-2 bg-surface-container-highest py-3 rounded-xl" onPress={() => onCopy(item.content!)}>
          <Copy size={16} color={isLight ? '#000000' : '#FFFFFF'} />
          <Text weight="bold" className="text-accent">Copy Raw JSON</Text>
        </Pressable>
      </View>
    );
  } catch (e) {
    return <Text className="text-text-secondary mt-4">{item.content}</Text>;
  }
};

export default function HistoryScreen() {
  const router = useRouter();
  const themeMode = useAppStore((state) => state.themeMode);
  const isLight = themeMode === 'light';
  const [items, setItems] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadHistory = async () => {
      const { data, error } = await fetchHistoryRecords();
      if (!mounted) return;
      if (error || !data) {
        setItems([]);
        setLoading(false);
        return;
      }
      setItems(data);
      setLoading(false);
    };

    loadHistory();

    return () => {
      mounted = false;
    };
  }, []);

  const handleCopy = async (content: string | null) => {
    if (!content) return;
    await Clipboard.setStringAsync(content);
    Alert.alert('Copied', 'Item copied to clipboard.');
  };

  return (
    <ScreenContainer scrollable={false} className="bg-background">
      <View className="flex-row items-center py-4 h-16">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2 rounded-lg active:bg-surface-high">
          <ChevronLeft size={24} color={isLight ? '#000000' : '#FFFFFF'} />
        </Pressable>
        <Text variant="headline" className="ml-2 tracking-tighter">History</Text>
      </View>

      <Text className="text-text-secondary mb-8 font-inter">Your personal AI logs and social intelligence archive.</Text>

      {loading ? (
        <View className="py-20 items-center">
          <ActivityIndicator color={isLight ? '#000000' : '#FFFFFF'} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          <View className="gap-4">
            {items.length === 0 ? (
              <EmptyState
                title="No history yet"
                message="Every generation, reply set, and analysis will appear here once you start using Stitch Noir."
                icon={History}
              />
            ) : (
              items.map((item) => (
                <Pressable key={item.id} onPress={() => setExpandedId(expandedId === item.id ? null : item.id)}>
                  <Card className={`rounded-2xl border p-5 ${expandedId === item.id ? 'border-accent bg-bg-elevated' : 'border-border bg-bg-surface'}`}>
                    <View className="flex-row items-center justify-between mb-4">
                      <View className={`rounded px-2 py-0.5 ${item.type === 'analysis' ? 'bg-accent/10' : item.type === 'reply' ? 'bg-accent/10' : 'bg-danger/10'}`}>
                        <Text size="xs" weight="bold" className="uppercase tracking-widest text-text-secondary">
                          {item.type}
                        </Text>
                      </View>
                      <Text className="text-text-secondary text-[10px]">{item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</Text>
                    </View>
                    
                    <HistoryItemContent item={item} />

                    {expandedId === item.id && (
                      <ExpandedHistoryItem item={item} onCopy={handleCopy} />
                    )}
                  </Card>
                </Pressable>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </ScreenContainer>
  );
}
