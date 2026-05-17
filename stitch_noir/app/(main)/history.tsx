import React, { useEffect, useState } from 'react';
import { View, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { fetchHistoryRecords, HistoryRecord } from '@/services/appData';
import { ChevronLeft, Copy } from 'lucide-react-native';

const HistoryItemContent = ({ item }: { item: HistoryRecord }) => {
  if (!item.content) return null;

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
                       <Copy size={14} color="#958da1" />
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        )}

        <Pressable className="mt-2 flex-row items-center justify-center gap-2 bg-surface-container-highest py-3 rounded-xl" onPress={() => onCopy(item.content!)}>
          <Copy size={16} color="#d3bbff" />
          <Text weight="bold" className="text-primary">Copy Raw JSON</Text>
        </Pressable>
      </View>
    );
  } catch (e) {
    return <Text className="text-on-surface-variant mt-4">{item.content}</Text>;
  }
};

export default function HistoryScreen() {
  const router = useRouter();
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
          <ChevronLeft size={24} color="#e8e0ee" />
        </Pressable>
        <Text variant="headline" className="ml-2 tracking-tighter">History</Text>
      </View>

      <Text className="text-on-surface-variant mb-8 font-inter">Your personal AI logs and social intelligence archive.</Text>

      {loading ? (
        <View className="py-20 items-center">
          <ActivityIndicator color="#d3bbff" />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          <View className="gap-4">
            {items.length === 0 ? (
              <Card className="p-10 bg-surface-container border border-outline-variant items-center rounded-3xl">
                <View className="w-16 h-16 rounded-full bg-surface-container-high items-center justify-center mb-6">
                   <History size={32} color="#958da1" />
                </View>
                <Text weight="bold" size="xl" className="text-center">No history yet</Text>
                <Text className="text-outline text-center mt-2 leading-relaxed">
                  Every Gemini generation and analysis is logged here once you start using the lab.
                </Text>
              </Card>
            ) : (
              items.map((item) => (
                <Pressable key={item.id} onPress={() => setExpandedId(expandedId === item.id ? null : item.id)}>
                  <Card className={`p-5 border rounded-2xl ${expandedId === item.id ? 'bg-surface-container-high border-primary/50' : 'bg-surface-container border-outline-variant'}`}>
                    <View className="flex-row items-center justify-between mb-4">
                      <View className={`px-2 py-0.5 rounded ${item.type === 'analysis' ? 'bg-secondary-container' : item.type === 'reply' ? 'bg-primary-container' : 'bg-tertiary-container'}`}>
                        <Text size="xs" weight="bold" className="uppercase tracking-widest" style={{ color: item.type === 'analysis' ? '#e6ecff' : item.type === 'reply' ? '#dac5ff' : '#ffbec1' }}>
                          {item.type}
                        </Text>
                      </View>
                      <Text className="text-outline text-[10px]">{item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</Text>
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
