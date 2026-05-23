import React, { useEffect, useState } from 'react';
import { View, TextInput, Pressable, ActivityIndicator, Alert, ScrollView, Image, Modal, Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ModernComposer } from '@/components/ui/ModernComposer';
import { Settings, Sparkles, Paperclip, ArrowUp, ChevronDown, Plus } from 'lucide-react-native';
import { TONE_OPTIONS, normalizeToneName } from '@/lib/tonePrompts';
import { useAppStore } from '@/store/useAppStore';
import { generateText } from '@/services/gemini';
import { extractJson } from '@/services/geminiHelpers';
import { CopyButton } from '@/components/tones/CopyButton';

export default function BiosScreen() {
  const router = useRouter();
  const themeMode = useAppStore((state) => state.themeMode);
  const isLight = themeMode === 'light';
  const activeTone = useAppStore((state) => state.activeTone);
  const setActiveTone = useAppStore((state) => state.setActiveTone);
  const user = useAppStore((state) => state.user);

  const [bioInput, setBioInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ text: string; tone: string }[]>([]);
  const [isTonePickerOpen, setIsTonePickerOpen] = useState(false);

  const selectedTone = normalizeToneName(activeTone ?? 'Witty');

  const handleGenerate = async () => {
    if (!bioInput.trim()) {
      Alert.alert('Missing input', 'Describe your vibe first.');
      return;
    }

    setLoading(true);
    try {
      const prompt = `
You write premium social bios that feel human, current, and believable.

Goal:
- Turn the user's actual interests and vibe into 3 short bio options
- Make each option feel distinct, modern, and easy to use on dating apps or social profiles
- Avoid anything that sounds generic, cheesy, overly poetic, or AI-generated

User input:
"${bioInput}"

Selected vibe:
"${selectedTone}"

Style rules:
- Each bio must clearly reflect the user's input
- Keep each bio one line only
- Maximum 50 characters
- No hashtags
- No quotation marks
- No forced emojis
- Make the wording natural, specific, and social-media-ready
- Keep the tone subtle, confident, and fresh
- Avoid repeating sentence structure across the 3 results
- Prefer real-world phrasing over clever but fake-sounding lines

Tone guidance:
- Witty: sharp, playful, light
- Mysterious: understated, intriguing, cool
- Savage: confident, dry, controlled
- Professional: polished, smart, composed
- Flirty: warm, charming, effortless

Return only valid JSON:
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

  const handlePickReference = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
      type: ['text/plain', 'text/markdown'],
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    try {
      const referenceText = await FileSystem.readAsStringAsync(result.assets[0].uri);
      setBioInput((current) => (current.trim() ? `${current.trim()}\n\n${referenceText.trim()}` : referenceText.trim()));
    } catch {
      Alert.alert('Upload failed', 'Only text files are supported here.');
    }
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
            <Settings size={22} color={isLight ? '#000000' : '#FFFFFF'} />
          </Pressable>
        </View>
      </View>

        <View className="flex-1">
          <View className="mt-8 mb-6">
            {/* <Text variant="display" className="text-4xl">Bio Writer</Text> */}
          </View>

          <ScrollView
            className="flex-1"
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 16 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Main content area - show results or a placeholder */}
            {results.length === 0 ? (
              <EmptyState
                title="Ready to write your bio"
                message="Drop in a vibe, a screenshot, or a few words and Stitch Noir will shape it into something sharper."
                icon={Sparkles}
                action={<Button label="Generate Bio" icon={ArrowUp} onPress={() => void handleGenerate()} className="rounded-full" />}
              />
            ) : (
              <View className="flex-1">
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
                        <CopyButton value={result.text} />
                      </View>
                      <Text className="text-on-surface leading-relaxed text-base mb-4">{result.text}</Text>
                      <View className="flex-row items-center justify-between pt-3 border-t border-outline-variant/30">
                        <Text className="text-outline text-xs">Tone: {result.tone}</Text>
                      </View>
                    </Card>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Composer pinned to bottom */}
          <View className="border-t border-outline-variant bg-background py-4 -mx-margin-mobile">
            <ModernComposer
              value={bioInput}
              onChangeText={setBioInput}
              placeholder="Describe your vibe..."
              inputClassName="text-base leading-6 text-on-surface"
              inputProps={{
                returnKeyType: 'default',
                blurOnSubmit: false,
              }}
              toolbarLeft={
                <Pressable
                  onPress={handlePickReference}
                  className="h-11 w-11 items-center justify-center rounded-full border border-border bg-bg-surface active:bg-bg-elevated"
                >
                  <Paperclip size={20} color={isLight ? '#000000' : '#FFFFFF'} />
                </Pressable>
              }
              toolbarCenter={
                <Pressable
                  onPress={() => setIsTonePickerOpen(true)}
                  className="flex-row items-center gap-2 rounded-full border border-border bg-accent/10 px-3 py-2 active:bg-white/10"
                >
                  <Sparkles size={16} color={isLight ? '#000000' : '#FFFFFF'} />
                  <Text size="sm" className="text-accent">{selectedTone}</Text>
                  <ChevronDown size={14} color={isLight ? '#000000' : '#FFFFFF'} />
                </Pressable>
              }
              toolbarRight={
                <Pressable
                  onPress={() => {
                    void handleGenerate();
                    setBioInput('');
                  }}
                  disabled={loading}
                  style={{
                    height: 48,
                    width: 48,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 999,
                    backgroundColor: loading
                      ? isLight ? 'rgba(17,17,17,0.08)' : 'rgba(243,243,243,0.12)'
                      : bioInput.trim()
                        ? isLight ? '#111111' : '#F3F3F3'
                        : isLight ? 'rgba(17,17,17,0.08)' : 'rgba(243,243,243,0.12)'
                  }}
                >
                  {loading ? <ActivityIndicator color={isLight ? '#111111' : '#111111'} /> : <ArrowUp size={18} color={bioInput.trim() ? (isLight ? '#FFFFFF' : '#111111') : (isLight ? '#6B7280' : '#9CA3AF')} />}
                </Pressable>
              }
            />
          </View>

                <Modal visible={isTonePickerOpen} transparent animationType="fade" onRequestClose={() => setIsTonePickerOpen(false)}>
                  <Pressable className="flex-1 justify-end bg-black/55 px-4 pb-6" onPress={() => setIsTonePickerOpen(false)}>
                    <Pressable className="overflow-hidden rounded-[28px] border border-border bg-surface p-4" onPress={(event) => event.stopPropagation()}>
                      <Text weight="bold" size="xl">Choose tone</Text>
                      <Text className="mt-1 text-on-surface-variant">Replies will follow the selected prompt style.</Text>
                      <View className="mt-4 gap-2">
                                {TONE_OPTIONS.map((tone) => {
                                  const isSelected = tone === normalizeToneName(activeTone ?? 'Witty');
                                  return (
                                    <Pressable
                                      key={tone}
                                      onPress={() => {
                                        setActiveTone(tone);
                                        setIsTonePickerOpen(false);
                                      }}
                                      style={{
                                        borderColor: isSelected ? (isLight ? '#111111' : '#F3F3F3') : undefined,
                                        backgroundColor: isSelected ? (isLight ? '#111111' : '#F3F3F3') : undefined,
                                      }}
                                    >
                                      <Text weight="semibold" className={isSelected ? (isLight ? 'text-background' : 'text-background') : 'text-text-secondary'} style={isSelected ? { color: isLight ? '#FFFFFF' : '#111111' } : undefined}>{tone}</Text>
                                      {isSelected ? <Text size="xs" style={{ color: isLight ? '#FFFFFF' : '#111111' }}>Selected</Text> : null}
                                    </Pressable>
                                  );
                                })}
                      </View>
                    </Pressable>
                  </Pressable>
                </Modal>
                
        </View>
      </ScreenContainer>
  );
}