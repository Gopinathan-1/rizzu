import React, { useEffect, useState } from 'react';
import { View, TextInput, Pressable, ActivityIndicator, Alert, ScrollView, Image } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { History, Settings, Copy, Share2, Sparkles } from 'lucide-react-native';
import { generateText } from '@/services/gemini';
import { extractJson } from '@/services/geminiHelpers';
import { useAppStore } from '@/store/useAppStore';

export default function BiosScreen() {
  const router = useRouter();
  const activeTone = useAppStore((state) => state.activeTone);
  const user = useAppStore((state) => state.user);
  
  const [bioInput, setBioInput] = useState('');
  const [selectedTone, setSelectedTone] = useState(activeTone || 'Witty');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ text: string; tone: string }[]>([]);

  useEffect(() => {
    if (activeTone) {
      setSelectedTone(activeTone);
    }
  }, [activeTone]);

  const handleGenerate = async () => {
    if (!bioInput.trim()) {
      Alert.alert('Missing input', 'Describe your vibe first.');
      return;
    }

    setLoading(true);
    try {
const prompt = `
You are an elite dating app and social media bio writer.

Your job is to create bios that:
1. CLEARLY reflect the user's actual interests/personality
2. Match the selected vibe naturally
3. Sound like real modern profiles people would actually use

USER DESCRIPTION:
"${bioInput}"

SELECTED VIBE:
"${selectedTone}"

STRICT RULES:
- Every bio MUST clearly relate to the user's input
- The connection to the user's interests should be obvious instantly
- Do NOT generate vague quotes or random poetic lines
- Avoid overly deep, dramatic, or cringe wording
- Bios must feel realistic, modern, confident, and attractive
- Keep them short, punchy, and memorable
- One line only
- Maximum 50 characters
- No hashtags
- No quotation marks
- No forced emojis
- Make all 3 bios noticeably different
- Prioritize clarity + personality over fancy wording

GOOD BIO STYLE EXAMPLES:
Input: "I love romance anime"
Good:
- "Romance anime set my standards"
- "Living in a shoujo storyline"
- "Anime love stories > real ones"

Bad:
- "Chasing hearts drawn in ink"
- "Some stories feel unreal"
- "Lost between silent emotions"

TONE GUIDE:
- Witty → playful, clever, fun
- Mysterious → subtle, intriguing, attractive
- Savage → bold, cocky, teasing
- Professional → polished, smart, classy
- Flirty → charming, smooth, confident

OUTPUT RULES:
- Return ONLY a valid JSON array
- No explanations
- No markdown

FORMAT:
["bio1", "bio2", "bio3"]
`;

      const response = await generateText(prompt);
      const parsed = extractJson<string[]>(response);
      // Attach the tone used at generation time to each result so later tone changes
      // don't retroactively alter which tone was used for these bios.
      setResults(parsed.map((t) => ({ text: t, tone: selectedTone })));
    } catch (error) {
      Alert.alert('Generation failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', 'Text copied to clipboard.');
  };

  return (
    <ScreenContainer scrollable={false} className="bg-background">
      <View className="flex-row items-center py-4 h-16">
        <View className="flex-1" />
        <View className="absolute inset-x-0 items-center pointer-events-none">
          <Text variant="headline" className="text-2xl tracking-tighter">Stitch Noir</Text>
        </View>
        <View className="flex-row items-center gap-4">
          <Pressable className="p-2 rounded-lg active:bg-surface-high" onPress={() => router.push('/settings')}>
            <Settings size={22} color="#f5f5f5" />
          </Pressable>
          <View className="rounded-full border border-outline-variant px-3 py-2">
            <Text size="sm" className="text-primary">{user?.full_name ?? user?.email ?? 'Signed in'}</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          <View className="mt-8 mb-6">
            <Text variant="display" className="text-4xl">Bio Writer</Text>
            <Text className="text-on-surface-variant mt-2 text-lg font-inter">
              Engineer your digital persona with precision.
            </Text>
          </View>

          <View className="mt-8">
            <View className="flex-row justify-between items-center mb-4">
              <Text variant="label" className="text-on-surface-variant">
                Your Vibe
              </Text>
              <View className="bg-surface-container-high px-2 py-0.5 rounded">
                 <Text className="text-primary text-[10px] font-bold">
                   {bioInput.length}/500
                 </Text>
              </View>
            </View>
            <Card className="bg-surface-container border border-outline-variant p-4">
              <TextInput
                multiline
                value={bioInput}
                onChangeText={setBioInput}
                className="text-on-surface font-inter text-base min-h-[120px]"
                placeholderTextColor="#958da1"
                placeholder='E.g. "I love architecture, chess, and traveling to the Alps."'
                textAlignVertical="top"
              />
            </Card>
          </View>

          <View className="mt-8">
            <View className="flex-row items-center justify-between mb-4">
              <Text variant="label" className="text-on-surface-variant">Vibe Setting</Text>
              <View className="flex-row items-center gap-2">
                <View className="w-2 h-2 rounded-full bg-primary" />
                <Text size="xs" className="text-primary font-bold">{selectedTone}</Text>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5 px-5">
              <View className="flex-row gap-2">
                {['Witty', 'Mysterious', 'Savage', 'Professional', 'Flirty'].map((tone) => (
                  <Pressable
                    key={tone}
                    onPress={() => setSelectedTone(tone)}
                    className={`px-5 py-3 rounded-full border ${selectedTone === tone ? 'bg-primary-container border-primary' : 'bg-surface-low border-outline-variant'}`}
                  >
                    <Text weight="bold" size="sm" className={selectedTone === tone ? 'text-on-primary-container' : 'text-on-surface'}>
                      {tone}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          {results.length > 0 && (
            <View>
              <Text size="sm" className="text-on-surface-variant mb-3 uppercase tracking-wider">Generated bios</Text>
              {results.map((result, index) => (
                <Card key={`${result.text}-${index}`} className="p-5 bg-surface-container border border-outline-variant rounded-2xl mb-3">
                  <View className="flex-row justify-between items-start mb-4">
                    <View className="bg-secondary-container px-2 py-1 rounded-full">
                      <Text size="xs" weight="bold" className="text-on-secondary-container uppercase">
                        Bio {index + 1}
                      </Text>
                    </View>
                    <Pressable onPress={() => handleCopy(result.text)} className="p-2 rounded-full bg-white/5 border border-white/10">
                      <Copy size={16} color="#e8e0ee" />
                    </Pressable>
                  </View>
                  <Text className="text-on-surface leading-relaxed text-base mb-4">{result.text}</Text>
                  <View className="flex-row items-center justify-between pt-3 border-t border-outline-variant/30">
                    <Text className="text-outline text-xs">Tone: {result.tone}</Text>
                    <Pressable onPress={() => handleCopy(result.text)} className="flex-row items-center gap-2">
                      <Share2 size={16} color="#958da1" />
                      <Text size="sm" className="text-on-surface-variant">Copy</Text>
                    </Pressable>
                  </View>
                </Card>
              ))}
            </View>
          )}

          {!bioInput && results.length === 0 ? (
            <View className="items-center justify-center py-12">
              <Text className="text-on-surface-variant text-center">Describe your vibe above, select a tone, and generate your bios.</Text>
            </View>
          ) : null}
        </ScrollView>
      </ScreenContainer>
  );
}