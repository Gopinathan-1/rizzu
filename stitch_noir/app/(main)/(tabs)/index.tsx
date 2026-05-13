import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Button } from '@/components/ui/Button';
import {
  History,
  Settings,
  Clipboard,
  Camera,
  ChevronRight,
  Zap,
  UserCircle,
  BarChart3,
  MessageSquarePlus,
  Sparkles,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as ClipboardExpo from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { generateText, generateVisionText } from '@/services/gemini';
import { extractJson } from '@/services/geminiHelpers';
import { addHistoryRecord, fetchTrendingTones, TrendingToneRecord } from '@/services/appData';
import { analyzeConversation, analyzeScreenshot, type ConversationAnalysisResult } from '@/services/conversationAnalysis';
import { useAppStore } from '@/store/useAppStore';

const fallbackTones: TrendingToneRecord[] = [
  {
    id: 'witty',
    name: 'Witty',
    description: 'Clever, fast-paced, and intellectually sharp.',
    example: 'I only respond to people with great taste and better timing.',
    usage_count: 0,
  },
  {
    id: 'mysterious',
    name: 'Mysterious',
    description: 'Reserved, intriguing, and layered.',
    example: 'Maybe I already know exactly what you were going to say next.',
    usage_count: 0,
  },
  {
    id: 'savage',
    name: 'Savage',
    description: 'Bold, sharp, and unapologetic.',
    example: 'That idea was ambitious. The execution can still be saved.',
    usage_count: 0,
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Polished and clear for formal chats.',
    example: 'Thanks for the update. I can follow up with next steps shortly.',
    usage_count: 0,
  },
  {
    id: 'flirty',
    name: 'Flirty',
    description: 'Warm, playful, and charming.',
    example: 'You keep sending messages like that and I’m going to get distracted.',
    usage_count: 0,
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const [tones, setTones] = useState<TrendingToneRecord[]>(fallbackTones);
  const [loadingTones, setLoadingTones] = useState(true);
  const [pasteModalVisible, setPasteModalVisible] = useState(false);
  const [screenshotModalVisible, setScreenshotModalVisible] = useState(false);
  const [conversation, setConversation] = useState('');
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [analysis, setAnalysis] = useState<ConversationAnalysisResult | null>(null);
  const [replies, setReplies] = useState<string[]>([]);
  const [screenshotLoading, setScreenshotLoading] = useState(false);
  const [screenshotAsset, setScreenshotAsset] = useState<{ uri: string; base64: string; mimeType: string } | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState('');
  const [draggingOver, setDraggingOver] = useState(false);
  const setActiveTone = useAppStore((state) => state.setActiveTone);
  const setAnalysisStore = useAppStore((state) => state.setAnalysis);

  useEffect(() => {
    let mounted = true;

    const loadTones = async () => {
      const { data } = await fetchTrendingTones();
      if (mounted && data?.length) {
        setTones(data);
      }
      if (mounted) {
        setLoadingTones(false);
      }
    };

    loadTones();

    return () => {
      mounted = false;
    };
  }, []);

  const handleAnalyzeConversation = async () => {
    if (!conversation.trim()) {
      setAnalysisError('Paste a conversation first.');
      return;
    }

    setAnalysisLoading(true);
    setAnalysisError('');
    setAnalysis(null);
    setReplies([]);

    try {
      const result = await analyzeConversation(conversation);
      
      setAnalysis(result);
      setReplies(result.replies ?? []);
      setAnalysisStore({ tone: result.tone, mood: result.mood, replyStyles: result.replyStyles });

      await addHistoryRecord({
        type: 'analysis',
        content: JSON.stringify({ conversation, analysis: { tone: result.tone, mood: result.mood, replyStyles: result.replyStyles } }),
      });
      setConversation('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Analysis failed';
      setAnalysisError(message);
      console.error('Analysis error:', error);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handlePickScreenshot = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access to upload a screenshot.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
      base64: true,
    });

    if (result.canceled || !result.assets[0]?.base64) {
      return;
    }

    const asset = result.assets[0];
    if (!asset.base64) return;

    setScreenshotAsset({
      uri: asset.uri,
      base64: asset.base64,
      mimeType: asset.mimeType ?? 'image/jpeg',
    });
    setScreenshotPreview('');
    setAnalysis(null);
    setReplies([]);
    setAnalysisError('');
    setScreenshotModalVisible(true);
  };

  const handleAnalyzeScreenshot = async () => {
    if (!screenshotAsset?.base64) {
      Alert.alert('Add screenshot', 'Choose a screenshot first.');
      return;
    }

    setScreenshotLoading(true);
    setAnalysisError('');
    setAnalysis(null);
    setReplies([]);

    try {
      const result = await analyzeScreenshot(screenshotAsset.base64, screenshotAsset.mimeType);
      
      setScreenshotPreview(result.extractedText);
      setAnalysis({ tone: result.tone, mood: result.mood, replyStyles: result.replyStyles, replies: result.replies });
      setReplies(result.replies ?? []);
      setAnalysisStore({ tone: result.tone, mood: result.mood, replyStyles: result.replyStyles, extractedText: result.extractedText });
      
      await addHistoryRecord({
        type: 'analysis',
        content: JSON.stringify(result),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Screenshot analysis failed';
      setAnalysisError(message);
      console.error('Screenshot analysis error:', error);
    } finally {
      setScreenshotLoading(false);
    }
  };

  const handleDragOver = (e: any) => {
    e.preventDefault?.();
    e.stopPropagation?.();
    setDraggingOver(true);
  };

  const handleDragLeave = (e: any) => {
    e.preventDefault?.();
    e.stopPropagation?.();
    setDraggingOver(false);
  };

  const handleDrop = async (e: any) => {
    e.preventDefault?.();
    e.stopPropagation?.();
    setDraggingOver(false);

    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      Alert.alert('Invalid file', 'Please drop an image file.');
      return;
    }

    // Convert file to base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      const base64Data = base64String.split(',')[1]; // Remove data:image/... prefix

      setScreenshotAsset({
        uri: base64String,
        base64: base64Data,
        mimeType: file.type,
      });
      setScreenshotPreview('');
      setAnalysis(null);
      setReplies([]);
      setAnalysisError('');
    };
    reader.readAsDataURL(file);
  };

  const openTone = (tone: TrendingToneRecord) => {
    setActiveTone(tone.name);
    router.push('/reply-generator');
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

      <View className="mt-8 mb-8">
        <Text variant="display" className="text-5xl">Your AI{"\n"}Wingman.</Text>
        <Text className="text-on-surface-variant mt-2 text-lg font-inter">
          Elevate every message with Aura's elite social intelligence.
        </Text>
      </View>

      <View className="gap-4">
        <Pressable onPress={() => setPasteModalVisible(true)}>
          <Card className="flex-row items-center p-6 bg-surface-container border border-outline-variant rounded-xl active:bg-surface-high">
            <View className="mr-4">
              <Clipboard size={32} color="#d3bbff" />
            </View>
            <View className="flex-1">
              <Text weight="bold" size="md">Paste Conversation</Text>
              <Text variant="label" className="text-on-surface-variant lowercase tracking-normal font-inter opacity-70">Text-based analysis</Text>
            </View>
            <ChevronRight size={20} color="#958da1" />
          </Card>
        </Pressable>

        <Pressable onPress={() => setScreenshotModalVisible(true)} disabled={screenshotLoading}>
          <Card className="flex-row items-center p-6 bg-surface-container border border-outline-variant rounded-xl active:bg-surface-high">
            <View className="mr-4">
              <Camera size={32} color="#d3bbff" />
            </View>
            <View className="flex-1">
              <Text weight="bold" size="md">Upload Screenshot</Text>
              <Text variant="label" className="text-on-surface-variant lowercase tracking-normal font-inter opacity-70">Visual OCR analysis</Text>
            </View>
            {screenshotLoading ? <ActivityIndicator color="#d3bbff" /> : <ChevronRight size={20} color="#958da1" />}
          </Card>
        </Pressable>
      </View>

      {analysisError ? (
        <Card className="mt-4 p-4 bg-red-500/10 border border-red-500/30">
          <Text className="text-red-200">{analysisError}</Text>
        </Card>
      ) : null}

      <View className="mt-10">
        <View className="flex-row items-center justify-between mb-4">
          <Text variant="label" className="text-on-surface-variant">Trending Tones</Text>
          {loadingTones ? <ActivityIndicator color="#d3bbff" /> : <Text className="text-primary text-xs font-bold">View all</Text>}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5 px-5">
          <View className="flex-row gap-3">
            {tones.map((tone, i) => (
              <Pressable key={tone.id} onPress={() => openTone(tone)}>
                <Card className={`w-[190px] p-4 border rounded-2xl ${i === 0 ? 'bg-primary-container border-primary' : 'bg-surface-container border-outline-variant'}`}>
                  <View className="flex-row items-center justify-between mb-2">
                    <Text weight="bold" size="md" className={i === 0 ? 'text-on-primary-container' : 'text-on-surface'}>{tone.name}</Text>
                    <View className="bg-black/10 px-2 py-0.5 rounded-full">
                      <Text size="xs" className={i === 0 ? 'text-on-primary-container' : 'text-on-surface-variant'}>{tone.usage_count ?? 0}</Text>
                    </View>
                  </View>
                  <Text size="sm" className={i === 0 ? 'text-on-primary-container/80' : 'text-on-surface-variant'} numberOfLines={3}>{tone.description ?? 'Trending tone template'}</Text>
                  <Text size="xs" className="mt-3 italic text-on-surface-variant" numberOfLines={2}>{tone.example ?? 'Example preview unavailable.'}</Text>
                </Card>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      <View className="mt-12">
        <Text variant="label" className="text-on-surface-variant mb-4">Quick Actions</Text>
        <View className="gap-4">
          <Pressable onPress={() => router.push({ pathname: '/(main)/(tabs)/bios', params: { mode: 'opener' } })}>
            <Card className="p-6 bg-surface-container border border-outline-variant min-h-[160px] justify-between rounded-xl active:bg-surface-high">
              <Zap size={24} color="#d3bbff" />
              <View>
                <Text variant="headline" size="xl" className="mb-1">Generate Opener</Text>
                <Text className="text-on-surface-variant text-sm">Break the ice instantly with AI logic.</Text>
              </View>
            </Card>
          </Pressable>

          <View className="flex-row gap-4">
            <Pressable className="flex-1" onPress={() => router.push({ pathname: '/(main)/(tabs)/bios', params: { mode: 'bio' } })}>
              <Card className="p-6 bg-surface-container border border-outline-variant aspect-square justify-between rounded-xl active:bg-surface-high">
                <Sparkles size={24} color="#adc6ff" />
                <View>
                  <Text weight="bold" size="md" className="mb-1">Write Bio</Text>
                  <Text className="text-on-surface-variant text-xs">Profile optimization.</Text>
                </View>
              </Card>
            </Pressable>
            
            {/* Vault quick-action removed */}
          </View>
        </View>
      </View>

      <View className="mt-12 mb-20">
        <View className="flex-row items-center justify-between mb-4">
          <Text variant="label" className="text-on-surface-variant">Recent Generations</Text>
          <ChevronRight size={20} color="#958da1" />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5 px-5">
          <View className="flex-row gap-4">
            <Card className="w-[280px] p-5 bg-surface-low border border-outline-variant rounded-xl">
              <View className="flex-row items-center justify-between mb-4">
                <View className="bg-secondary-container px-2 py-0.5 rounded">
                  <Text weight="bold" className="text-[10px] text-on-secondary-container uppercase">Witty</Text>
                </View>
                <Text className="text-on-surface-variant text-[10px]">2m ago</Text>
              </View>
              <Text className="italic text-on-surface leading-relaxed text-sm">
                "I usually don't send the first message, but your choice in architecture is too good to ignore. Frank Lloyd Wright enthusiast?"
              </Text>
            </Card>

            <Card className="w-[280px] p-5 bg-surface-low border border-outline-variant rounded-xl">
              <View className="flex-row items-center justify-between mb-4">
                <View className="bg-tertiary-container px-2 py-0.5 rounded">
                  <Text weight="bold" className="text-[10px] text-on-tertiary-container uppercase">Mysterious</Text>
                </View>
                <Text className="text-on-surface-variant text-[10px]">15m ago</Text>
              </View>
              <Text className="italic text-on-surface leading-relaxed text-sm">
                "The third photo is giving me intense 'I have a secret hideout in the Alps' energy. Close?"
              </Text>
            </Card>
          </View>
        </ScrollView>
      </View>

      <View className="absolute bottom-10 right-6">
        <Pressable className="w-16 h-16 rounded-full bg-primary items-center justify-center shadow-2xl active:scale-90 transition-transform">
          <MessageSquarePlus size={28} color="#3f008d" />
        </Pressable>
      </View>

      <Modal visible={pasteModalVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/70 justify-end">
          <View className="bg-background rounded-t-[28px] p-5 pb-6 min-h-[64%] border-t border-white/10 shadow-2xl shadow-black/40">
            <View className="flex-row items-center justify-between mb-4">
              <Text variant="headline">Paste Conversation</Text>
              <Pressable onPress={() => setPasteModalVisible(false)}>
                <Text className="text-primary">Close</Text>
              </Pressable>
            </View>

            <View className="overflow-hidden rounded-[28px] border border-white/8 bg-white/4 shadow-2xl shadow-black/20">
              <View className="px-4 pt-4 pb-3 border-b border-white/8 bg-white/3">
                <Text size="sm" weight="bold" className="text-white/90 mb-1">Quick reply suggestions</Text>
                <Text size="xs" className="text-white/45">Generated inline before you type the response.</Text>
              </View>

              <View className="px-4 py-4">
                {replies.length > 0 && analysis ? (
                  <View className="mb-4 gap-2.5">
                    <Text size="xs" className="uppercase tracking-[0.35em] text-white/35">Suggested replies</Text>
                    <View className="gap-2.5">
                      {replies.slice(0, 3).map((reply, index) => {
                        const toneLabel = analysis.replyStyles[index] ?? analysis.replyStyles[analysis.replyStyles.length - 1] ?? 'Friendly';

                        return (
                          <View key={`${reply}-${index}`} className="self-start max-w-[92%] rounded-[30px] bg-gradient-to-br from-white/8 to-white/[0.03] border border-white/10 px-4 py-3.5 shadow-lg shadow-black/10">
                            <View className="flex-row items-center gap-3">
                              <Text numberOfLines={1} className="flex-1 text-[14px] leading-5 text-white/95 tracking-tight">
                                {reply}
                              </Text>

                              <View className="flex-row items-center gap-2">
                                <View className="rounded-full border border-white/8 bg-white/6 px-3 py-1">
                                  <Text size="xs" className="text-white/65 tracking-tight">
                                    {toneLabel}
                                  </Text>
                                </View>

                                <Pressable
                                  onPress={async () => {
                                    await ClipboardExpo.setStringAsync(reply);
                                    Alert.alert('Copied', 'Reply copied to clipboard.');
                                  }}
                                  className="rounded-full bg-white/5 p-2 border border-white/10 active:scale-[0.96] transition-all duration-200"
                                >
                                  <Clipboard size={15} color="#efe9ff" />
                                </Pressable>
                              </View>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                ) : null}

                <TextInput
                  multiline
                  value={conversation}
                  onChangeText={setConversation}
                  placeholder="Paste the conversation here..."
                  placeholderTextColor="#958da1"
                  className="min-h-[170px] bg-surface-container-lowest/80 border border-white/8 rounded-[24px] p-4 text-on-surface"
                  textAlignVertical="top"
                />

                <Button
                  label={analysisLoading ? 'Analyzing...' : 'Analyze'}
                  className="mt-4 py-4 rounded-full bg-gradient-to-r from-violet-500 to-blue-500 shadow-lg shadow-violet-500/20"
                  onPress={handleAnalyzeConversation}
                  disabled={analysisLoading}
                />

                {analysisLoading ? <ActivityIndicator color="#d3bbff" className="mt-4" /> : null}
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={screenshotModalVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/70 justify-end">
          <View className="bg-background rounded-t-[28px] p-5 pb-6 min-h-[68%] border-t border-white/10 shadow-2xl shadow-black/40">
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text variant="headline">Upload Screenshot</Text>
                <Text size="xs" className="text-white/45">Quick replies appear inline in the same composer.</Text>
              </View>
              <Pressable onPress={() => setScreenshotModalVisible(false)}>
                <Text className="text-primary">Close</Text>
              </Pressable>
            </View>

            <View className="overflow-hidden rounded-[28px] border border-white/8 bg-white/4 shadow-2xl shadow-black/20">
              <View className="px-4 pt-4 pb-3 border-b border-white/8 bg-white/3">
                <Text size="sm" weight="bold" className="text-white/90 mb-1">Quick reply suggestions</Text>
                <Text size="xs" className="text-white/45">Select a screenshot, analyze it, then copy a reply.</Text>
              </View>

              <View className="px-4 py-4">
                {replies.length > 0 && analysis ? (
                  <View className="mb-4 gap-2.5">
                    <Text size="xs" className="uppercase tracking-[0.35em] text-white/35">Suggested replies</Text>
                    <View className="gap-2.5">
                      {replies.slice(0, 3).map((reply, index) => {
                        const toneLabel = analysis.replyStyles[index] ?? analysis.replyStyles[analysis.replyStyles.length - 1] ?? 'Friendly';

                        return (
                          <View key={`${reply}-${index}`} className="self-start max-w-[92%] rounded-[30px] bg-gradient-to-br from-white/8 to-white/[0.03] border border-white/10 px-4 py-3.5 shadow-lg shadow-black/10">
                            <View className="flex-row items-center gap-3">
                              <Text numberOfLines={1} className="flex-1 text-[14px] leading-5 text-white/95 tracking-tight">
                                {reply}
                              </Text>

                              <View className="flex-row items-center gap-2">
                                <View className="rounded-full border border-white/8 bg-white/6 px-3 py-1">
                                  <Text size="xs" className="text-white/65 tracking-tight">
                                    {toneLabel}
                                  </Text>
                                </View>

                                <Pressable
                                  onPress={async () => {
                                    await ClipboardExpo.setStringAsync(reply);
                                    Alert.alert('Copied', 'Reply copied to clipboard.');
                                  }}
                                  className="rounded-full bg-white/5 p-2 border border-white/10 active:scale-[0.96] transition-all duration-200"
                                >
                                  <Clipboard size={15} color="#efe9ff" />
                                </Pressable>
                              </View>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                ) : null}

                <View className="gap-3">
                  {screenshotAsset ? (
                    <View className="overflow-hidden rounded-[24px] border border-white/8 bg-black/20">
                      <Image source={{ uri: screenshotAsset.uri }} className="h-40 w-full" resizeMode="cover" />
                    </View>
                  ) : null}

                  <View
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`rounded-[24px] border-2 ${
                      draggingOver
                        ? 'border-primary bg-primary/10 shadow-lg shadow-primary/30'
                        : 'border-white/10 bg-white/5'
                    } px-4 py-4 active:scale-[0.99] transition-all duration-200`}
                  >
                    <View className="flex-row items-center gap-3 mb-2">
                      <Camera size={18} color={draggingOver ? '#d3bbff' : '#ffffff'} />
                      <Text weight="bold" className={draggingOver ? 'text-primary' : 'text-white/90'}>
                        Drag & drop screenshot
                      </Text>
                    </View>
                    <Text size="xs" className="text-white/45 mb-3">or</Text>
                    <Pressable onPress={handlePickScreenshot} className="py-2">
                      <Text weight="bold" className="text-primary">Choose Screenshot</Text>
                    </Pressable>
                    <Text size="xs" className="mt-1 text-white/45">Pick an image from your gallery.</Text>
                  </View>

                  <TextInput
                    editable={false}
                    value={screenshotPreview || 'OCR text will appear here after analysis.'}
                    multiline
                    placeholder="OCR text will appear here after analysis."
                    placeholderTextColor="#958da1"
                    className="min-h-[150px] bg-surface-container-lowest/80 border border-white/8 rounded-[24px] p-4 text-on-surface"
                    textAlignVertical="top"
                  />

                  <Button
                    label={screenshotLoading ? 'Analyzing Screenshot...' : 'Analyze Screenshot'}
                    className="py-4 rounded-full bg-gradient-to-r from-violet-500 to-blue-500 shadow-lg shadow-violet-500/20"
                    onPress={handleAnalyzeScreenshot}
                    disabled={screenshotLoading || !screenshotAsset}
                  />

                  {screenshotLoading ? <ActivityIndicator color="#d3bbff" className="mt-2" /> : null}
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
