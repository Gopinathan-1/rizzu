import React, { useEffect, useState } from 'react';
import { View, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { fetchHistoryRecords, HistoryRecord } from '@/services/appData';
import { ChevronLeft, Copy } from 'lucide-react-native';

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
    Alert.alert('Copied', 'History item copied to clipboard.');
  };

  return (
    <ScreenContainer>
      <View className="flex-row items-center py-4">
        <Pressable onPress={() => router.back()}>
          <ChevronLeft size={24} color="#e8e0ee" />
        </Pressable>
        <Text variant="headline" className="ml-4">History</Text>
      </View>

      <Text className="text-outline mb-6">Every Gemini generation and analysis is logged here.</Text>

      {loading ? (
        <ActivityIndicator color="#d3bbff" />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <View className="gap-4">
            {items.length === 0 ? (
              <Card className="p-6 bg-surface-container border border-outline-variant">
                <Text weight="bold" size="lg">No history yet</Text>
                <Text className="text-outline mt-2">Generate a reply, bio, opener, or analysis to populate this view.</Text>
              </Card>
            ) : (
              items.map((item) => (
                <Pressable key={item.id} onPress={() => setExpandedId(expandedId === item.id ? null : item.id)}>
                  <Card className="p-5 bg-surface-container border border-outline-variant">
                    <View className="flex-row items-center justify-between mb-3">
                      <View className="px-2 py-1 rounded-full bg-primary-container">
                        <Text size="xs" weight="bold" className="text-on-primary-container uppercase">{item.type}</Text>
                      </View>
                      <Text className="text-outline text-xs">{item.created_at ? new Date(item.created_at).toLocaleString() : ''}</Text>
                    </View>
                    <Text className="text-on-surface-variant" numberOfLines={expandedId === item.id ? undefined : 3}>
                      {item.content}
                    </Text>
                    {expandedId === item.id ? (
                      <Pressable className="mt-4 flex-row items-center gap-2" onPress={() => handleCopy(item.content)}>
                        <Copy size={16} color="#958da1" />
                        <Text>Copy</Text>
                      </Pressable>
                    ) : null}
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
