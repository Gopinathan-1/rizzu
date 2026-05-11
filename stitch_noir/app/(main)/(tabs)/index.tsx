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
import * as ImagePicker from 'expo-image-picker';
import { generateText, generateVisionText } from '@/services/gemini';
import { extractJson } from '@/services/geminiHelpers';
import { addHistoryRecord, fetchTrendingTones, TrendingToneRecord } from '@/services/appData';
import { useAppStore } from '@/store/useAppStore';

type AnalysisOutput = {
  tone: string;
  mood: string;
  replyStyles: string[];
};

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
  const [conversation, setConversation] = useState('');
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisOutput | null>(null);
  const [screenshotLoading, setScreenshotLoading] = useState(false);
  const [screenshotPreview, setScreenshotPreview] = useState('');
  const [analysisBadge, setAnalysisBadge] = useState('');
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

    try {
      const prompt = `Analyze this conversation and return:\n1. The overall emotional tone (e.g., flirty, tense, casual, professional)\n2. The other person's intent or mood\n3. 3 suggested reply styles (e.g., playful, direct, empathetic)\n\nReturn JSON exactly in this shape: {"tone":"","mood":"","replyStyles":["","",""]}\n\nConversation:\n${conversation}`;

      const response = await generateText(prompt);
      const parsed = extractJson<AnalysisOutput>(response);
      setAnalysis(parsed);
      setAnalysisBadge(parsed.tone);
      setAnalysisStore({ tone: parsed.tone, mood: parsed.mood, replyStyles: parsed.replyStyles });
      await addHistoryRecord({
        type: 'analysis',
        content: JSON.stringify({ conversation, analysis: parsed }),
      });
      setPasteModalVisible(false);
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : 'Analysis failed');
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

    setScreenshotLoading(true);
    setAnalysisError('');

    try {
      const asset = result.assets[0];
      if (!asset.base64) throw new Error('Could not read image data');

      const prompt = `Extract all the text from this conversation screenshot, then analyze:\n1. The emotional tone of the conversation\n2. The other person\'s mood and intent\n3. 3 tailored reply suggestions\n\nReturn structured JSON exactly in this shape: {"extractedText":"","tone":"","mood":"","replies":["","",""]}`;

      const response = await generateVisionText(prompt, asset.base64, asset.mimeType ?? 'image/jpeg');
      const parsed = extractJson<{ extractedText: string; tone: string; mood: string; replies: string[] }>(response);

      setScreenshotPreview(parsed.extractedText);
      setAnalysis({ tone: parsed.tone, mood: parsed.mood, replyStyles: parsed.replies });
      setAnalysisBadge(parsed.tone);
      setAnalysisStore({ tone: parsed.tone, mood: parsed.mood, replyStyles: parsed.replies, extractedText: parsed.extractedText });
      await addHistoryRecord({
        type: 'analysis',
        content: JSON.stringify(parsed),
      });
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : 'Screenshot analysis failed');
    } finally {
      setScreenshotLoading(false);
    }
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

        <Pressable onPress={handlePickScreenshot} disabled={screenshotLoading}>
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

      {screenshotPreview ? (
        <Card className="mt-4 p-4 bg-surface-container-low border border-outline-variant">
          <Text variant="label" className="mb-2">Screenshot Text Preview</Text>
          <Text className="text-on-surface-variant text-sm leading-relaxed">{screenshotPreview}</Text>
        </Card>
      ) : null}

      {analysis ? (
        <Card className="mt-4 p-5 bg-surface-container border border-outline-variant">
          <View className="flex-row items-center justify-between mb-3">
            <View className="bg-primary-container px-3 py-1 rounded-full">
              <Text size="xs" weight="bold" className="text-on-primary-container">{analysisBadge || analysis.tone}</Text>
            </View>
            <Text className="text-outline text-xs uppercase tracking-widest">Mood</Text>
          </View>
          <Text weight="bold" size="lg" className="mb-2">{analysis.mood}</Text>
          <View className="gap-2 mt-3">
            {analysis.replyStyles.map((style) => (
              <View key={style} className="px-3 py-2 rounded-xl bg-surface-low border border-outline-variant">
                <Text className="text-on-surface-variant">{style}</Text>
              </View>
            ))}
          </View>
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
            
            <Pressable className="flex-1" onPress={() => router.push('/(main)/(tabs)/vault')}>
              <Card className="p-6 bg-surface-container border border-outline-variant aspect-square justify-between rounded-xl active:bg-surface-high">
                <BarChart3 size={24} color="#ffb2b7" />
                <View>
                  <Text weight="bold" size="md" className="mb-1">The Vault</Text>
                  <Text className="text-on-surface-variant text-xs">Saved elite replies.</Text>
                </View>
              </Card>
            </Pressable>
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
          <View className="bg-background rounded-t-[28px] p-6 min-h-[55%]">
            <View className="flex-row items-center justify-between mb-4">
              <Text variant="headline">Paste Conversation</Text>
              <Pressable onPress={() => setPasteModalVisible(false)}>
                <Text className="text-primary">Close</Text>
              </Pressable>
            </View>
            <TextInput
              multiline
              value={conversation}
              onChangeText={setConversation}
              placeholder="Paste the conversation here..."
              placeholderTextColor="#958da1"
              className="min-h-[180px] bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 text-on-surface"
              textAlignVertical="top"
            />
            <Button
              label={analysisLoading ? 'Analyzing...' : 'Analyze'}
              className="mt-4 py-4 rounded-2xl"
              onPress={handleAnalyzeConversation}
              disabled={analysisLoading}
            />
            {analysisLoading ? <ActivityIndicator color="#d3bbff" className="mt-4" /> : null}
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
