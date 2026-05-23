import React, { useEffect, useState } from 'react';
import { View, Pressable, ScrollView, Image, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Button } from '@/components/ui/Button';
import {
  Settings,
  Heart,
  Share2,
  RotateCcw,
  Copy,
  Plus,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { addHistoryRecord, saveVaultRecord } from '@/services/appData';
import { generateToneReplies } from '@/services/conversationAnalysis';
import { useAppStore } from '@/store/useAppStore';
import { normalizeToneName } from '@/lib/tonePrompts';

export default function ReplyGeneratorScreen() {
  const router = useRouter();
  const activeTone = useAppStore((state) => state.activeTone);
  const themeMode = useAppStore((state) => state.themeMode);
  const isLight = themeMode === 'light';
  const currentAnalysis = useAppStore((state) => state.currentAnalysis);
  const addToVault = useAppStore((state) => state.addToVault);
  const [selectedTone, setSelectedTone] = useState(normalizeToneName(activeTone || 'Savage'));
  const [context, setContext] = useState(currentAnalysis?.extractedText || '');
  const [loading, setLoading] = useState(false);
  const [replies, setReplies] = useState<string[]>([
    'Calculated risk is my specialty. You should know by now I never make a move without an endgame.',
  ]);

  useEffect(() => {
    if (currentAnalysis?.extractedText && !context) {
      setContext(currentAnalysis.extractedText);
    }
  }, [currentAnalysis, context]);

  useEffect(() => {
    if (activeTone) {
      setSelectedTone(normalizeToneName(activeTone));
    }
  }, [activeTone]);

  const handleGenerate = async () => {
    if (!context.trim()) {
      Alert.alert('Add context', 'Paste a conversation or type a message first.');
      return;
    }

    setLoading(true);
    try {
      const toneToUse = normalizeToneName(selectedTone);
      const result = await generateToneReplies(toneToUse, context);
      if (result.replies.length === 0) {
        throw new Error('No replies were returned. Try again.');
      }
      setReplies(result.replies);
      await addHistoryRecord({ type: 'reply', content: JSON.stringify({ tone: toneToUse, context, replies: result.replies }) });
    } catch (error) {
      Alert.alert('Generation failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (reply: string) => {
    await Clipboard.setStringAsync(reply);
    Alert.alert('Copied', 'Reply copied to clipboard.');
  };

  const handleSave = async (reply: string) => {
    const { data, error } = await saveVaultRecord({ type: 'reply', content: reply, tone: selectedTone });
    if (error || !data) {
      Alert.alert('Save failed', error instanceof Error ? error.message : 'Could not save reply.');
      return;
    }

    addToVault({ id: data.id, type: 'reply', content: data.content, tone: data.tone ?? undefined, createdAt: data.created_at });
    Alert.alert('Saved', 'Reply added to your vault.');
  };

  return (
    <ScreenContainer scrollable={false} className="bg-background">
      <View className="flex-row items-center justify-between py-4 h-16">
        <Text variant="headline" className="text-2xl tracking-tighter">Stitch Noir</Text>
        <View className="flex-row items-center gap-4">
          <Pressable className="p-2 rounded-lg active:bg-surface-high" onPress={() => router.push('/settings')}>
            <Settings size={22} color={isLight ? '#000000' : '#FFFFFF'} />
          </Pressable>
          <View className="w-8 h-8 rounded-full border border-outline-variant overflow-hidden">
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=100&auto=format&fit=crop' }}
              className="w-full h-full"
            />
          </View>
        </View>
      </View>

      <View className="mt-8">
          <View className="flex-row items-center gap-3 mb-4">
          <Text variant="label" className="text-on-surface-variant">Incoming Context</Text>
          <View className="flex-1 h-[1px] bg-outline-variant" />
        </View>

        <Card className="rounded-xl border border-border bg-bg-elevated p-4">
          <TextInput
            multiline
            value={context}
            onChangeText={setContext}
            placeholder="Paste or type conversation context..."
            placeholderTextColor={isLight ? '#000000' : '#FFFFFF'}
            className="min-h-[120px] text-on-surface font-inter text-base"
            textAlignVertical="top"
          />
        </Card>
      </View>

      <View className="mt-8 flex-1">
        <View className="flex-row items-center justify-between mb-4">
          <Text variant="label" className="text-on-surface-variant">Tone Selector</Text>
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
                style={{
                  borderColor: selectedTone === tone ? (isLight ? '#111111' : '#F3F3F3') : undefined,
                  backgroundColor: selectedTone === tone ? (isLight ? '#111111' : '#F3F3F3') : undefined,
                }}
              >
                <Text weight="bold" size="sm" style={selectedTone === tone ? { color: isLight ? '#FFFFFF' : '#111111' } : undefined}>
                  {tone}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <Button
          label={loading ? 'Generating...' : 'Generate'}
          icon={loading ? undefined : Plus}
          iconPosition="right"
          className="mt-5 rounded-2xl py-4"
          onPress={handleGenerate}
          disabled={loading}
        />

        {loading ? <ActivityIndicator color={isLight ? '#000000' : '#FFFFFF'} className="mt-4" /> : null}

        <ScrollView className="mt-6" contentContainerStyle={{ paddingBottom: 120 }}>
          <View className="gap-4">
            {replies.map((reply, index) => (
              <Card key={`${reply}-${index}`} className="rounded-2xl border border-border bg-bg-surface p-5">
                <View className="flex-row items-center justify-between mb-4">
                  <View className="bg-secondary-container px-2 py-1 rounded-full">
                    <Text size="xs" weight="bold" className="text-on-secondary-container uppercase">Response {index + 1}</Text>
                  </View>
                  <View className="flex-row items-center gap-3">
                    <Pressable onPress={() => handleCopy(reply)}>
                      <Copy size={18} color={isLight ? '#000000' : '#FFFFFF'} />
                    </Pressable>
                    <Pressable onPress={() => handleSave(reply)}>
                      <Heart size={18} color="#C94040" />
                    </Pressable>
                    <Pressable onPress={handleGenerate}>
                      <RotateCcw size={18} color={isLight ? '#000000' : '#FFFFFF'} />
                    </Pressable>
                  </View>
                </View>
                <Text className="text-text-primary leading-relaxed">{reply}</Text>
                <View className="mt-4 flex-row items-center justify-between border-t border-border pt-4">
                  <Text className="text-text-secondary text-xs">Tone: {normalizeToneName(selectedTone)}</Text>
                  <Pressable onPress={() => handleCopy(reply)} className="flex-row items-center gap-2">
                    <Share2 size={16} color={isLight ? '#000000' : '#FFFFFF'} />
                    <Text size="sm">Copy</Text>
                  </Pressable>
                </View>
              </Card>
            ))}
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
