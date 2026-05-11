import React, { useState } from 'react';
import { View, TextInput, Pressable, ActivityIndicator, Alert, ScrollView, Image } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Button } from '@/components/ui/Button';
import { History, Settings, Copy, RotateCcw, Heart, Share2, Sparkles, User, UserCircle } from 'lucide-react-native';
import { generateText } from '@/services/gemini';
import { extractJson } from '@/services/geminiHelpers';
import { addHistoryRecord, saveVaultRecord } from '@/services/appData';
import { useAppStore } from '@/store/useAppStore';

export default function BiosScreen() {
  const router = useRouter();
  const activeTone = useAppStore((state) => state.activeTone);
  const addToVault = useAppStore((state) => state.addToVault);
  
  const [mode, setMode] = useState(0); // 0: Bio, 1: Opener
  const [bioInput, setBioInput] = useState('');
  const [openerInput, setOpenerInput] = useState('');
  const [selectedTone, setSelectedTone] = useState(activeTone || 'Witty');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const handleGenerate = async () => {
    const input = mode === 0 ? bioInput : openerInput;
    if (!input.trim()) {
      Alert.alert('Missing input', mode === 0 ? 'Describe your vibe first.' : 'Paste a profile description first.');
      return;
    }

    setLoading(true);
    try {
      const prompt =
        mode === 0
          ? `Write 3 creative social media bios in a ${selectedTone} tone for someone who describes themselves as:\n${input}\n\nEach bio should be under 150 characters, punchy, and highly engaging.\nReturn as JSON array: ["bio1", "bio2", "bio3"]`
          : `Write 3 unique conversation openers in a ${selectedTone} tone for reaching out to someone with this profile/vibe:\n${input}\n\nMake them charming, non-generic, and context-aware.\nReturn as JSON array: ["opener1", "opener2", "opener3"]`;

      const response = await generateText(prompt);
      const parsed = extractJson<string[]>(response);
      setResults(parsed);
      await addHistoryRecord({ 
        type: mode === 0 ? 'bio' : 'opener', 
        content: JSON.stringify({ input, tone: selectedTone, results: parsed }) 
      });
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

  const handleSave = async (text: string) => {
    const type = mode === 0 ? 'bio' : 'opener';
    const { data, error } = await saveVaultRecord({ type, content: text, tone: selectedTone });
    if (error || !data) {
      Alert.alert('Save failed', error instanceof Error ? error.message : 'Could not save item.');
      return;
    }

    addToVault({ id: data.id, type, content: data.content, tone: data.tone ?? undefined, createdAt: data.created_at });
    Alert.alert('Saved', 'Added to your vault.');
  };

  return (
    <ScreenContainer className="bg-background">
      <View className="flex-row items-center justify-between py-4 h-16">
        <Text variant="headline" className="text-2xl tracking-tighter">Aura AI</Text>
        <View className="flex-row items-center gap-4">
          <Pressable className="p-2 rounded-lg active:bg-surface-high" onPress={() => router.push('/history')}>
            <History size={22} color="#f5f5f5" />
          </Pressable>
          <Pressable className="p-2 rounded-lg active:bg-surface-high" onPress={() => router.push('/settings')}>
            <Settings size={22} color="#f5f5f5" />
          </Pressable>
          <View className="w-8 h-8 rounded-full border border-outline-variant overflow-hidden">
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=100&auto=format&fit=crop' }}
              className="w-full h-full"
            />
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="mt-8 mb-6">
          <Text variant="display" className="text-4xl">Identity Lab</Text>
          <Text className="text-on-surface-variant mt-2 text-lg font-inter">
            Engineer your digital persona with surgical precision.
          </Text>
        </View>

        <SegmentedControl
          options={['Bio Writer', 'Opener Generator']}
          selectedIndex={mode}
          onChange={(idx) => {
            setMode(idx);
            setResults([]);
          }}
        />

        <View className="mt-8">
          <View className="flex-row justify-between items-center mb-4">
            <Text variant="label" className="text-on-surface-variant">
              {mode === 0 ? 'Your Vibe' : 'Their Profile'}
            </Text>
            <View className="bg-surface-container-high px-2 py-0.5 rounded">
               <Text className="text-primary text-[10px] font-bold">
                 {mode === 0 ? bioInput.length : openerInput.length}/500
               </Text>
            </View>
          </View>
          <Card className="bg-surface-container border border-outline-variant p-4">
            <TextInput
              multiline
              value={mode === 0 ? bioInput : openerInput}
              onChangeText={mode === 0 ? setBioInput : setOpenerInput}
              className="text-on-surface font-inter text-base min-h-[120px]"
              placeholderTextColor="#958da1"
              placeholder={mode === 0 ? 'E.g. "I love architecture, chess, and traveling to the Alps."' : 'E.g. "She has photos of Frank Lloyd Wright buildings and mentions a secret hideout."'}
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

        <Button
          label={loading ? 'Generating...' : mode === 0 ? 'Generate Bio' : 'Generate Opener'}
          icon={loading ? undefined : Sparkles}
          iconPosition="right"
          className="mt-8 py-4 rounded-2xl"
          onPress={handleGenerate}
          disabled={loading}
        />
        {loading ? <ActivityIndicator color="#d3bbff" className="mt-4" /> : null}

        <View className="mt-8 gap-4">
          {results.map((result, index) => (
            <Card key={`${result}-${index}`} className="p-5 bg-surface-container border border-outline-variant rounded-2xl">
              <View className="flex-row justify-between items-center mb-4">
                <View className="bg-secondary-container px-2 py-1 rounded-full">
                  <Text size="xs" weight="bold" className="text-on-secondary-container uppercase">
                    {mode === 0 ? 'Bio' : 'Opener'} {index + 1}
                  </Text>
                </View>
                <View className="flex-row items-center gap-4">
                  <Pressable onPress={() => handleCopy(result)}>
                    <Copy size={18} color="#e8e0ee" />
                  </Pressable>
                  <Pressable onPress={() => handleSave(result)}>
                    <Heart size={18} color="#ffb2b7" />
                  </Pressable>
                  <Pressable onPress={handleGenerate}>
                    <RotateCcw size={18} color="#e8e0ee" />
                  </Pressable>
                </View>
              </View>
              <Text className="text-on-surface leading-relaxed text-base">{result}</Text>
              <View className="flex-row items-center justify-between mt-4 pt-4 border-t border-outline-variant/30">
                <Text className="text-outline text-xs">Tone: {selectedTone}</Text>
                <Pressable onPress={() => handleCopy(result)} className="flex-row items-center gap-2">
                  <Share2 size={16} color="#958da1" />
                  <Text size="sm" className="text-on-surface-variant">Copy</Text>
                </Pressable>
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
