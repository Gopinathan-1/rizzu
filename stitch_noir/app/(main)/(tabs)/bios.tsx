import React, { useEffect, useState } from 'react';
import { View, TextInput, Pressable, ActivityIndicator, Alert, ScrollView, Image, Modal, Platform, TouchableWithoutFeedback } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ModernComposer } from '@/components/ui/ModernComposer';
import { Settings, Sparkles, Paperclip, ArrowUp, ChevronDown, Plus, RotateCcw } from 'lucide-react-native';
import { TONE_OPTIONS, getToneOptions, normalizeToneName } from '@/lib/tonePrompts';
import { useAppStore } from '@/store/useAppStore';
import { generateText } from '@/services/gemini';
import { extractJson } from '@/services/geminiHelpers';
import { CopyButton } from '@/components/tones/CopyButton';
import { CHOCOLATE_TRUFFLE_DARK, CHOCOLATE_TRUFFLE_LIGHT } from '@/theme/palette';

export default function BiosScreen() {
  const router = useRouter();
  const themeMode = useAppStore((state) => state.themeMode);
  const isLight = themeMode === 'light';
  const activeTone = useAppStore((state) => state.activeTone);
  const setActiveTone = useAppStore((state) => state.setActiveTone);
  const user = useAppStore((state) => state.user);
  const toneProfile = useAppStore((state) => state.toneProfile);
  const toneOptions = getToneOptions(toneProfile);

  const [bioInput, setBioInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ text: string; tone: string }[]>([]);
  const [isTonePickerOpen, setIsTonePickerOpen] = useState(false);
  const [bioToneSelection, setBioToneSelection] = useState(() => normalizeToneName(activeTone ?? 'Witty'));
  const [refineModalVisible, setRefineModalVisible] = useState(false);
  const [refineInstruction, setRefineInstruction] = useState('Make it sharper and more natural.');
  const [refineTone, setRefineTone] = useState('');
  const [refineTargetIndex, setRefineTargetIndex] = useState<number | null>(null);
  const [refineLoading, setRefineLoading] = useState(false);

  const selectedTone = bioToneSelection;
  const pickerToneOptions = ['All', ...toneOptions.filter((tone) => tone !== 'All')];
  const isAllTonesSelected = selectedTone === 'All';

  const openRefineModal = (index: number, tone: string) => {
    setRefineTargetIndex(index);
    setRefineTone(tone);
    setRefineInstruction('Make it sharper and more natural.');
    setRefineModalVisible(true);
  };

  const handleApplyRefine = async () => {
    if (refineTargetIndex === null) return;

    const currentResult = results[refineTargetIndex];
    if (!currentResult) return;

    setRefineLoading(true);
    try {
      const toneToUse = refineTone || currentResult.tone || selectedTone || 'Witty';
      const prompt = `Rewrite this social bio to better match the tone: ${toneToUse}. Apply these instructions: ${refineInstruction}. Keep it one line, max 50 characters, and return only the rewritten bio.\n\nOriginal bio:\n"${currentResult.text}"\n\nUser vibe context:\n"${bioInput}"`;

      const response = await generateText(prompt);
      const refined = response.toString().trim().replace(/^"|"$/g, '');

      setResults((current) =>
        current.map((item, index) =>
          index === refineTargetIndex
            ? { text: refined, tone: normalizeToneName(toneToUse) }
            : item
        )
      );

      setRefineModalVisible(false);
      setRefineTargetIndex(null);
    } catch (error) {
      Alert.alert('Refinement failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setRefineLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!bioInput.trim()) {
      Alert.alert('Missing input', 'Describe your vibe first.');
      return;
    }

    setLoading(true);
    try {
      const prompt = isAllTonesSelected
        ? `
You write premium social bios that feel human, current, and believable.

Goal:
- Turn the user's actual interests and vibe into 5 short bio options
- Make each option match a different tone from the list below
- Make each option feel distinct, modern, and easy to use on dating apps or social profiles
- Avoid anything that sounds generic, cheesy, overly poetic, or AI-generated

User input:
"${bioInput}"

Requested tones:
${TONE_OPTIONS.join('\n')}

Style rules:
- Each bio must clearly reflect the user's input and its tone
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
[{"tone":"Witty","text":"bio1"},{"tone":"Mysterious","text":"bio2"},{"tone":"Savage","text":"bio3"},{"tone":"Professional","text":"bio4"},{"tone":"Flirty","text":"bio5"}]
`
        : `
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
      if (isAllTonesSelected) {
        const parsed = extractJson<{ tone: string; text: string }[]>(response);
        setResults(
          parsed.map((item) => ({
            text: item.text,
            tone: normalizeToneName(item.tone),
          }))
        );
      } else {
        const parsed = extractJson<string[]>(response);
        // Attach the tone used at generation time to each result so later tone changes
        // don't retroactively alter which tone was used for these bios.
        setResults(parsed.map((t) => ({ text: t, tone: selectedTone })));
      }
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
          <Text variant="headline" className="text-2xl tracking-tighter">RIZZ</Text>
        </View>
        <View className="flex-row items-center gap-4">
          <Pressable className="p-2 rounded-lg active:bg-surface-high" onPress={() => router.push('/settings')}>
            <Settings size={22} color={isLight ? CHOCOLATE_TRUFFLE_LIGHT.textPrimary : CHOCOLATE_TRUFFLE_DARK.textPrimary} />
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
                message="Drop in a vibe, a screenshot, or a few words and RIZZ will shape it into something sharper."
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
                        <View className="flex-row items-center gap-2">
                          <Pressable
                            onPress={() => openRefineModal(index, result.tone)}
                            className="flex-row items-center gap-1 rounded-full border border-border bg-bg-elevated px-3 py-2"
                          >
                            <RotateCcw size={14} color={isLight ? CHOCOLATE_TRUFFLE_LIGHT.textPrimary : CHOCOLATE_TRUFFLE_DARK.textPrimary} />
                            <Text size="xs">Refine</Text>
                          </Pressable>
                          <CopyButton value={result.text} />
                        </View>
                      </View>
                      <Text className="text-on-surface leading-relaxed text-base mb-4">{result.text}</Text>
                      <View className="flex-row items-center justify-between pt-3 border-t border-outline-variant/30">
                        <Text className="text-on-surface text-xs">Tone: {result.tone}</Text>
                      </View>
                    </Card>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Composer pinned to bottom */}
          <View className="bg-background py-4 -mx-margin-mobile">
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
                  <Paperclip size={20} color={isLight ? '#1A1A1A' : '#FDFBD4'} />
                </Pressable>
              }
              toolbarCenter={
                <Pressable
                onPress={() => setIsTonePickerOpen(true)}
                className="flex-row items-center gap-2 rounded-full border border-border bg-bg-surface/10 px-3 py-2 active:bg-white/10"
              >
                <Sparkles size={16} color={isLight ? 'rgba(113,54,0,0.6)' : '#FDFBD4'} />
                <Text size="sm" className="text-on-surface">{selectedTone}</Text>
                <ChevronDown size={14} color={isLight ? 'rgba(113,54,0,0.6)' : '#FDFBD4'} />
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
                      ? isLight ? CHOCOLATE_TRUFFLE_LIGHT.bgElevated : CHOCOLATE_TRUFFLE_DARK.bgElevated
                      : bioInput.trim()
                        ? isLight ? CHOCOLATE_TRUFFLE_LIGHT.accent : CHOCOLATE_TRUFFLE_DARK.accent
                        : isLight ? CHOCOLATE_TRUFFLE_LIGHT.bgElevated : CHOCOLATE_TRUFFLE_DARK.bgElevated
                  }}
                >
                  {loading ? <ActivityIndicator color={isLight ? CHOCOLATE_TRUFFLE_LIGHT.bgPrimary : CHOCOLATE_TRUFFLE_DARK.bgPrimary} /> : <ArrowUp size={18} color={bioInput.trim() ? CHOCOLATE_TRUFFLE_LIGHT.bgPrimary : (isLight ? CHOCOLATE_TRUFFLE_LIGHT.textSecondary : CHOCOLATE_TRUFFLE_DARK.textSecondary)} />}
                </Pressable>
              }
            />
          </View>

                <Modal visible={isTonePickerOpen} transparent animationType="fade" onRequestClose={() => setIsTonePickerOpen(false)}>
                  <TouchableWithoutFeedback onPress={() => setIsTonePickerOpen(false)}>
                    <View className="flex-1 justify-end bg-background/55 px-4 pb-6">
                      <View className="overflow-hidden rounded-[28px] border border-border bg-surface p-4" onStartShouldSetResponder={() => true}>
                      <Text weight="bold" size="xl">Choose tone</Text>
                      <Text className="mt-1 text-on-surface-variant">Replies will follow the selected prompt style.</Text>
                      <View className="mt-4">
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          className="-mx-5 px-5"
                          contentContainerStyle={{ paddingRight: 40 }}
                        >
                          <View className="flex-row gap-2">
                            {pickerToneOptions.map((tone) => {
                              const isSelected = tone === selectedTone;
                              return (
                                <Pressable
                                  key={tone}
                                  onPress={() => {
                                    if (tone !== 'All') {
                                      setActiveTone(tone);
                                    }
                                    setBioToneSelection(tone);
                                    setIsTonePickerOpen(false);
                                  }}
                                  style={{
                                    paddingVertical: 8,
                                    paddingHorizontal: 12,
                                    borderRadius: 999,
                                    borderColor: isSelected ? CHOCOLATE_TRUFFLE_LIGHT.accent : undefined,
                                    backgroundColor: isSelected ? CHOCOLATE_TRUFFLE_LIGHT.accent : undefined,
                                  }}
                                >
                                  <Text weight="bold" size="sm" style={isSelected ? { color: CHOCOLATE_TRUFFLE_LIGHT.bgPrimary } : undefined}>{tone}</Text>
                                </Pressable>
                              );
                            })}
                          </View>
                        </ScrollView>
                      </View>
                      </View>
                    </View>
                  </TouchableWithoutFeedback>
                </Modal>

                <Modal visible={refineModalVisible} animationType="slide" transparent onRequestClose={() => setRefineModalVisible(false)}>
                  <TouchableWithoutFeedback onPress={() => setRefineModalVisible(false)}>
                    <View className="flex-1 justify-end bg-background/55 px-4 pb-6">
                      <View className="overflow-hidden rounded-[28px] border border-border bg-surface p-4" onStartShouldSetResponder={() => true}>
                        <Text weight="bold" size="xl">Refine Bio</Text>
                        <Text className="mt-1 text-on-surface-variant">Tighten the wording without losing the vibe.</Text>

                        <View className="mt-4">
                          <Text size="xs" className="mb-2 uppercase tracking-wider text-on-surface-variant">Instructions</Text>
                          <TextInput
                            multiline
                            value={refineInstruction}
                            onChangeText={setRefineInstruction}
                            placeholder="Make it shorter, funnier, smoother..."
                            placeholderTextColor={isLight ? CHOCOLATE_TRUFFLE_LIGHT.textSecondary : CHOCOLATE_TRUFFLE_DARK.textSecondary}
                            className="min-h-[88px] rounded-2xl border border-border bg-bg-surface px-4 py-3 text-on-surface"
                            textAlignVertical="top"
                          />
                        </View>

                        <View className="mt-4">
                          <Text size="xs" className="mb-2 uppercase tracking-wider text-on-surface-variant">Tone</Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-2 px-2">
                            <View className="flex-row gap-2">
                              {TONE_OPTIONS.map((tone) => {
                                const isSelected = refineTone === tone;
                                return (
                                  <Pressable
                                    key={tone}
                                    onPress={() => setRefineTone(tone)}
                                    style={{
                                      paddingVertical: 8,
                                      paddingHorizontal: 12,
                                      borderRadius: 999,
                                      borderColor: isSelected ? CHOCOLATE_TRUFFLE_LIGHT.accent : undefined,
                                      backgroundColor: isSelected ? CHOCOLATE_TRUFFLE_LIGHT.accent : undefined,
                                    }}
                                  >
                                    <Text weight="bold" size="sm" style={isSelected ? { color: CHOCOLATE_TRUFFLE_LIGHT.bgPrimary } : undefined}>
                                      {tone}
                                    </Text>
                                  </Pressable>
                                );
                              })}
                            </View>
                          </ScrollView>
                        </View>

                        <View className="mt-4 flex-row justify-end gap-3">
                          <Pressable onPress={() => setRefineModalVisible(false)} className="rounded-full border border-border bg-bg-elevated px-4 py-2">
                            <Text>Cancel</Text>
                          </Pressable>
                          <Pressable
                            onPress={() => void handleApplyRefine()}
                            className="rounded-full px-4 py-2"
                            style={{ backgroundColor: isLight ? CHOCOLATE_TRUFFLE_LIGHT.accent : CHOCOLATE_TRUFFLE_DARK.accent }}
                            disabled={refineLoading}
                          >
                            {refineLoading ? (
                              <ActivityIndicator color={isLight ? CHOCOLATE_TRUFFLE_LIGHT.bgPrimary : CHOCOLATE_TRUFFLE_DARK.bgPrimary} />
                            ) : (
                              <Text weight="bold" style={{ color: isLight ? CHOCOLATE_TRUFFLE_LIGHT.bgPrimary : CHOCOLATE_TRUFFLE_DARK.bgPrimary }}>
                                Apply
                              </Text>
                            )}
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  </TouchableWithoutFeedback>
                </Modal>
                
        </View>
      </ScreenContainer>
  );
}