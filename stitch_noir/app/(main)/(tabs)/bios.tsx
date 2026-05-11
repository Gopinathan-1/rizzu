import React, { useState } from 'react';
import { View, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Button } from '@/components/ui/Button';
import { User, Copy, RotateCcw } from 'lucide-react-native';
import { generateText } from '@/services/gemini';
import { extractJson } from '@/services/geminiHelpers';
import { addHistoryRecord, saveVaultRecord } from '@/services/appData';
import { useAppStore } from '@/store/useAppStore';

export default function BiosScreen() {
  const router = useRouter();
  const [mode, setMode] = useState(0);
  const [bioInput, setBioInput] = useState('Avid traveler, espresso enthusiast, and amateur chess player. Looking for someone to beat me at Queen\'s Gambit.');
  const [openerInput, setOpenerInput] = useState('They love travel photos, espresso spots, and witty banter.');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const addToVault = useAppStore((state) => state.addToVault);

  const handleGenerate = async () => {
    const input = mode === 0 ? bioInput : openerInput;
    if (!input.trim()) {
      Alert.alert('Missing input', 'Add a description first.');
      return;
    }

    setLoading(true);
    try {
      const prompt =
        mode === 0
          ? `Write 3 creative social media bios for someone who describes themselves as:\n${input}\n\nEach bio should be under 150 characters, punchy, and have a distinct personality (confident, mysterious, playful).\nReturn as JSON array: ["bio1", "bio2", "bio3"]`
          : `Write 3 unique conversation openers for reaching out to someone with this profile:\n${input}\n\nMake them charming, non-generic, and context-aware.\nReturn as JSON array: ["opener1", "opener2", "opener3"]`;

      const response = await generateText(prompt);
      const parsed = extractJson<string[]>(response);
      setResults(parsed);
      await addHistoryRecord({ type: mode === 0 ? 'bio' : 'opener', content: JSON.stringify({ input, results: parsed }) });
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
    const { data, error } = await saveVaultRecord({ type, content: text });
    if (error || !data) {
      Alert.alert('Save failed', error instanceof Error ? error.message : 'Could not save item.');
      return;
    }

    addToVault({ id: data.id, type, content: data.content, tone: data.tone ?? undefined, createdAt: data.created_at });
    Alert.alert('Saved', 'Item added to your vault.');
  };

  return (
    <ScreenContainer>
      <View className="flex-row items-center justify-between py-4">
        <Pressable onPress={() => router.back()}>
          <Text variant="headline" className="text-3xl">Aura AI</Text>
        </Pressable>
        <View className="flex-row items-center space-x-4">
          <Pressable onPress={() => router.push('/history')}>
            <User size={24} color="#e8e0ee" />
          </Pressable>
        </View>
      </View>

      <View className="mt-4 mb-6">
        <Text variant="display" size="3xl">Identity Lab</Text>
        <Text className="text-outline mt-1">Engineer your digital persona with surgical precision.</Text>
      </View>

      <SegmentedControl
        options={['Bio Writer', 'Opener Generator']}
        selectedIndex={mode}
        onChange={setMode}
      />

      <View className="mt-8">
        <View className="flex-row justify-between mb-2">
          <Text variant="label">Input Source</Text>
          <Text className="text-primary text-xs font-bold">{mode === 0 ? `${bioInput.length}/500` : `${openerInput.length}/500`}</Text>
        </View>
        <Card className="bg-surface-container-lowest border border-outline-variant p-4 min-h-40">
          <TextInput
            multiline
            value={mode === 0 ? bioInput : openerInput}
            onChangeText={mode === 0 ? setBioInput : setOpenerInput}
            className="text-on-surface font-inter text-base min-h-36"
            placeholderTextColor="#958da1"
            placeholder={mode === 0 ? 'Describe yourself or your vibe...' : 'Describe the person or profile...'}
            textAlignVertical="top"
          />
        </Card>
      </View>

      <Button
        label={loading ? 'Generating...' : mode === 0 ? 'Generate Bio' : 'Generate Opener'}
        className="mt-8 py-5 rounded-2xl"
        onPress={handleGenerate}
        disabled={loading}
      />
      {loading ? <ActivityIndicator color="#d3bbff" className="mt-4" /> : null}

      <View className="mt-8 gap-4">
        {results.map((result, index) => (
          <Card key={`${result}-${index}`} className="p-5 bg-surface-container border border-outline-variant">
            <View className="flex-row justify-between mb-3">
              <Text variant="label">Option {index + 1}</Text>
              <View className="flex-row items-center gap-3">
                <Pressable onPress={() => handleCopy(result)}>
                  <Copy size={18} color="#958da1" />
                </Pressable>
                <Pressable onPress={() => handleSave(result)}>
                  <RotateCcw size={18} color="#958da1" />
                </Pressable>
              </View>
            </View>
            <Text className="text-on-surface-variant leading-relaxed">{result}</Text>
          </Card>
        ))}
      </View>
    </ScreenContainer>
  );
}
