import React, { useEffect, useState } from 'react';
import { View, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { Sparkles, Zap, Ghost, Heart, Shield, Search } from 'lucide-react-native';
import { generateText } from '@/services/gemini';
import { extractJson } from '@/services/geminiHelpers';
import { useAppStore } from '@/store/useAppStore';

export default function TonesScreen() {
  const router = useRouter();
  const activeTone = useAppStore((state) => state.activeTone);
  const setActiveTone = useAppStore((state) => state.setActiveTone);
  const examples = useAppStore((state) => state.trendingToneExamples);
  const setToneExample = useAppStore((state) => state.setTrendingToneExample);
  const [loading, setLoading] = useState(false);

  const tones = [
    {
      name: 'Witty',
      description: 'Clever, fast-paced, and intellectually sharp. Best for high-energy banter.',
      icon: Sparkles,
      color: '#d3bbff',
    },
    {
      name: 'Mysterious',
      description: 'Calculated, reserved, and intriguing. Creates a sense of depth and curiosity.',
      icon: Ghost,
      color: '#adc6ff',
    },
    {
      name: 'Savage',
      description: 'Bold, unapologetic, and high-dominance. For when you want to take control.',
      icon: Zap,
      color: '#ffb2b7',
    },
    {
      name: 'Professional',
      description: 'Polished, respectful, and clear. Ideal for networking or formal contexts.',
      icon: Shield,
      color: '#e8e0ee',
    },
    {
      name: 'Flirty',
      description: 'Warm, suggestive, and charming. Designed to build romantic tension.',
      icon: Heart,
      color: '#ffdad6',
    },
  ];

  useEffect(() => {
    let mounted = true;

    const loadExamples = async () => {
      setLoading(true);
      try {
        await Promise.all(
          tones.map(async (tone) => {
            if (examples[tone.name]) return;
            const prompt = `Give one example reply using the ${tone.name} tone to the message: "Hey, how's it going?" Keep it under 2 sentences. Return JSON exactly like {"reply":"..."}`;
            const response = await generateText(prompt);
            const parsed = extractJson<{ reply: string }>(response);
            if (mounted) {
              setToneExample(tone.name, parsed.reply);
            }
          })
        );
      } catch {
        // If Gemini fails, keep fallback descriptions only.
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadExamples();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <ScreenContainer>
      <View className="flex-row items-center justify-between py-4">
        <Text variant="headline" className="text-3xl">Tones</Text>
        <Search size={24} color="#e8e0ee" />
      </View>

      <View className="mt-4 mb-8">
        <Text className="text-outline text-lg">Select the AI personality that fits your current situation.</Text>
      </View>

      {loading ? <ActivityIndicator color="#d3bbff" className="mb-4" /> : null}

      <View className="space-y-4">
        {tones.map((tone) => {
          const Icon = tone.icon;
          const example = examples[tone.name];
          const isActive = activeTone === tone.name;

          return (
            <Pressable
              key={tone.name}
              onPress={() => {
                setActiveTone(tone.name);
                router.push('/reply-generator');
              }}
            >
              <Card className={`p-6 border flex-row items-center rounded-2xl ${isActive ? 'bg-primary-container border-primary' : 'bg-surface-container border-outline-variant'}`}>
                <View
                  className="w-14 h-14 rounded-2xl items-center justify-center mr-5"
                  style={{ backgroundColor: `${tone.color}20` }}
                >
                  <Icon size={28} color={tone.color} />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text weight="bold" size="xl">{tone.name}</Text>
                    {isActive ? (
                      <View className="bg-primary px-2 py-0.5 rounded">
                        <Text size="xs" weight="bold" className="text-on-primary">ACTIVE</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text className="text-outline text-sm leading-relaxed">{tone.description}</Text>
                  <Text className="mt-2 text-on-surface-variant text-xs italic" numberOfLines={2}>
                    {example || 'Loading example preview...'}
                  </Text>
                </View>
              </Card>
            </Pressable>
          );
        })}
      </View>

      <View className="mt-12 bg-surface-container-highest p-8 rounded-[32px] items-center">
        <Sparkles size={40} color="#d3bbff" />
        <Text weight="bold" size="xl" className="mt-4 text-center">Custom Tone Engine</Text>
        <Text className="text-outline text-center mt-2 leading-relaxed">
          Upload your own chat history to train Aura on your specific speaking style.
        </Text>
        <Button
          label="Try Beta"
          variant="secondary"
          size="sm"
          className="mt-6 px-10 rounded-xl"
        />
      </View>
    </ScreenContainer>
  );
}
