import React, { useEffect, useState } from 'react';
import { View, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { Sparkles, Zap, Ghost, Heart, Shield, Search, Upload, Info } from 'lucide-react-native';
import { generateText } from '@/services/gemini';
import { extractJson } from '@/services/geminiHelpers';
import { fetchTrendingTones, TrendingToneRecord } from '@/services/appData';
import { useAppStore } from '@/store/useAppStore';

const toneIcons: Record<string, any> = {
  Witty: Sparkles,
  Mysterious: Ghost,
  Savage: Zap,
  Professional: Shield,
  Flirty: Heart,
};

const toneColors: Record<string, string> = {
  Witty: '#d3bbff',
  Mysterious: '#adc6ff',
  Savage: '#ffb2b7',
  Professional: '#e8e0ee',
  Flirty: '#ffdad6',
};

export default function TonesScreen() {
  const router = useRouter();
  const activeTone = useAppStore((state) => state.activeTone);
  const setActiveTone = useAppStore((state) => state.setActiveTone);
  const examples = useAppStore((state) => state.trendingToneExamples);
  const setToneExample = useAppStore((state) => state.setTrendingToneExample);
  
  const [loading, setLoading] = useState(true);
  const [tones, setTones] = useState<TrendingToneRecord[]>([]);

  useEffect(() => {
    let mounted = true;

    const loadTones = async () => {
      setLoading(true);
      try {
        const { data } = await fetchTrendingTones();
        if (mounted && data) {
          setTones(data);
          
          // Load examples for any missing ones
          await Promise.all(
            data.map(async (tone) => {
              if (examples[tone.name]) return;
              try {
                const prompt = `Give one example reply using the ${tone.name} tone to the message: "Hey, how's it going?" Keep it under 2 sentences. Return JSON exactly like {"reply":"..."}`;
                const response = await generateText(prompt);
                const parsed = extractJson<{ reply: string }>(response);
                if (mounted) {
                  setToneExample(tone.name, parsed.reply);
                }
              } catch (e) {
                console.error(`Failed to load example for ${tone.name}`, e);
              }
            })
          );
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to load tones.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadTones();

    return () => {
      mounted = false;
    };
  }, []);

  const handleCustomToneUpload = () => {
    Alert.alert('Beta Feature', 'Custom Tone Engine is coming soon in the next update. You will be able to upload chat logs to train your own AI personality.');
  };

  return (
    <ScreenContainer className="bg-background">
      <View className="flex-row items-center justify-between py-4 h-16">
        <Text variant="headline" className="text-2xl tracking-tighter">Aura AI</Text>
        <View className="flex-row items-center gap-4">
          <Pressable className="p-2 rounded-lg active:bg-surface-high">
            <Search size={22} color="#f5f5f5" />
          </Pressable>
          <View className="w-8 h-8 rounded-full bg-surface-container-high items-center justify-center border border-outline-variant">
            <Info size={16} color="#958da1" />
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="mt-8 mb-8">
          <Text variant="display" className="text-4xl">Tone Gallery</Text>
          <Text className="text-on-surface-variant mt-2 text-lg font-inter">
            Select the AI personality that fits your current situation.
          </Text>
        </View>

        {loading && tones.length === 0 ? (
          <View className="py-20 items-center">
            <ActivityIndicator color="#d3bbff" size="large" />
            <Text className="text-outline mt-4">Tuning the AI frequencies...</Text>
          </View>
        ) : (
          <View className="gap-4">
            {tones.map((tone) => {
              const Icon = toneIcons[tone.name] || Sparkles;
              const color = toneColors[tone.name] || '#e8e0ee';
              const example = examples[tone.name] || tone.example;
              const isActive = activeTone === tone.name;

              return (
                <Pressable
                  key={tone.id}
                  onPress={() => {
                    setActiveTone(tone.name);
                    router.push('/reply-generator');
                  }}
                >
                  <Card className={`p-6 border flex-row items-center rounded-2xl ${isActive ? 'bg-primary-container border-primary' : 'bg-surface-container border-outline-variant'}`}>
                    <View
                      className="w-14 h-14 rounded-2xl items-center justify-center mr-5"
                      style={{ backgroundColor: `${color}20` }}
                    >
                      <Icon size={28} color={color} />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text weight="bold" size="xl" className={isActive ? 'text-on-primary-container' : 'text-on-surface'}>{tone.name}</Text>
                        {isActive ? (
                          <View className="bg-primary px-2 py-0.5 rounded">
                            <Text size="xs" weight="bold" className="text-on-primary">ACTIVE</Text>
                          </View>
                        ) : (
                           <View className="bg-black/10 px-2 py-0.5 rounded-full">
                             <Text size="xs" className="text-on-surface-variant">{tone.usage_count ?? 0} uses</Text>
                           </View>
                        )}
                      </View>
                      <Text className={`${isActive ? 'text-on-primary-container opacity-80' : 'text-outline'} leading-relaxed`} size="sm">
                        {tone.description}
                      </Text>
                      {example ? (
                        <Text className={`mt-3 text-xs italic ${isActive ? 'text-on-primary-container' : 'text-on-surface-variant'}`} numberOfLines={2}>
                          "{example}"
                        </Text>
                      ) : null}
                    </View>
                  </Card>
                </Pressable>
              );
            })}
          </View>
        )}

        <View className="mt-12 bg-surface-container-highest p-8 rounded-[32px] items-center border border-outline-variant/50">
          <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-6">
            <Upload size={32} color="#d3bbff" />
          </View>
          <Text weight="bold" size="xl" className="text-center">Custom Tone Engine</Text>
          <Text className="text-outline text-center mt-2 leading-relaxed">
            Upload your own chat history (WhatsApp, iMessage, etc.) to train Aura on your specific speaking style.
          </Text>
          <Button
            label="Upload History"
            variant="secondary"
            size="md"
            icon={Sparkles}
            className="mt-8 px-10 rounded-2xl w-full"
            onPress={handleCustomToneUpload}
          />
          <View className="mt-4 flex-row items-center gap-2">
            <View className="w-2 h-2 rounded-full bg-secondary" />
            <Text size="xs" className="text-secondary font-bold uppercase tracking-widest">Beta Access Required</Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
