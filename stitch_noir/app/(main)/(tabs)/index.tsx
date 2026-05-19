import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/tones/CopyButton';
import {
  History,
  Settings,
  Camera,
  ChevronRight,
  MessageSquarePlus,
  ArrowUp,
  Paperclip,
  Plus,
  Sparkles,
  ChevronDown,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { generateText, generateVisionText } from '@/services/gemini';
import { extractJson } from '@/services/geminiHelpers';
import { addHistoryRecord } from '@/services/appData';
import { analyzeConversation, analyzeScreenshot, type ConversationAnalysisResult } from '@/services/conversationAnalysis';
import { useAppStore } from '@/store/useAppStore';


export default function HomeScreen() {
  const router = useRouter();
  
  const [conversation, setConversation] = useState('');
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [analysis, setAnalysis] = useState<ConversationAnalysisResult | null>(null);
  const [replies, setReplies] = useState<string[]>([]);
  const [screenshotLoading, setScreenshotLoading] = useState(false);
  const [screenshotAsset, setScreenshotAsset] = useState<{ uri: string; base64: string; mimeType: string } | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState('');
  const [draggingOver, setDraggingOver] = useState(false);
  const [historyMessages, setHistoryMessages] = useState<Array<any>>([]);

  // Refinement modal state
  const [refineModalVisible, setRefineModalVisible] = useState(false);
  const [refineTarget, setRefineTarget] = useState<{ messageId: number | 'current'; replyIndex: number } | null>(null);
  const [refineInstruction, setRefineInstruction] = useState('');
  const [refineTone, setRefineTone] = useState('');
  const [refineLoading, setRefineLoading] = useState(false);
  const setAnalysisStore = useAppStore((state) => state.setAnalysis);
  const user = useAppStore((state) => state.user);

  

  const appendMessageToHistory = useCallback((entry: {
    input: string;
    screenshotAsset: { uri: string; base64: string; mimeType: string } | null;
    screenshotPreview: string;
    analysis: ConversationAnalysisResult | null;
    replies: string[];
  }) => {
    setHistoryMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        ...entry,
      },
    ]);
  }, []);

  const removeCurrentAttachment = useCallback(() => {
    setScreenshotAsset(null);
    setScreenshotPreview('');
    setAnalysis(null);
    setReplies([]);
    setAnalysisError('');
  }, []);

  const handleSendMessage = async () => {
    const trimmedConversation = conversation.trim();

    if (!trimmedConversation && !screenshotAsset) {
      setAnalysisError('Paste a conversation or upload an image first.');
      return;
    }

    setAnalysisLoading(true);
    setAnalysisError('');

    try {
      let nextAnalysis = analysis;
      let nextReplies = replies;

      if (trimmedConversation) {
        const result = await analyzeConversation(trimmedConversation);
        nextAnalysis = result;
        nextReplies = result.replies ?? [];
        setAnalysis(result);
        setReplies(nextReplies);
        setAnalysisStore({ tone: result.tone, mood: result.mood, replyStyles: result.replyStyles });
      }

      appendMessageToHistory({
        input: trimmedConversation,
        screenshotAsset,
        screenshotPreview,
        analysis: nextAnalysis,
        replies: nextReplies,
      });

      setConversation('');
      removeCurrentAttachment();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Analysis failed';
      setAnalysisError(message);
      console.error('Analysis error:', error);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const openRefineModal = (messageId: number | 'current', replyIndex: number, existing: string) => {
    setRefineTarget({ messageId, replyIndex });
    setRefineInstruction('Make it shorter and add a friendly emoji');
    setRefineTone(analysis?.tone ?? 'Casual');
    setRefineModalVisible(true);
  };

  const handleApplyRefine = async () => {
    if (!refineTarget) return;
    const { messageId, replyIndex } = refineTarget;
    setRefineLoading(true);
    try {
      const original =
        messageId === 'current'
          ? replies[replyIndex]
          : (historyMessages.find((m) => m.id === messageId)?.replies?.[replyIndex] ?? '');

      const toneToUse = refineTone || analysis?.tone || 'Casual';
      const prompt = `Rewrite the following reply to match the tone: ${toneToUse}. Apply these instructions: ${refineInstruction}. Keep it VERY SHORT (max 50 characters) and return ONLY the rewritten reply.\n\nOriginal:\n"${original}"`;

      const resp = await generateText(prompt);
      const newText = (resp || '').toString().trim().replace(/^"|"$/g, '');

      if (messageId === 'current') {
        setReplies((prev) => prev.map((r, i) => (i === replyIndex ? newText : r)));
      } else {
        setHistoryMessages((prev) =>
          prev.map((m) => {
            if (m.id !== messageId) return m;
            const newReplies = (m.replies || []).map((r: string, i: number) => (i === replyIndex ? newText : r));
            return { ...m, replies: newReplies };
          })
        );
      }

      setRefineModalVisible(false);
      setRefineInstruction('');
    } catch (error) {
      Alert.alert('Refinement failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setRefineLoading(false);
    }
  };

  const handlePickScreenshot = async () => {
    // Web fallback: use a hidden file input
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e: any) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (ev) => {
          const dataUrl = ev.target?.result as string;
          const base64Data = dataUrl.split(',')[1];
          setScreenshotAsset({ uri: dataUrl, base64: base64Data, mimeType: file.type });
          setScreenshotPreview('');
          setAnalysis(null);
          setReplies([]);
          setAnalysisError('');

          try {
            setScreenshotLoading(true);
            const result = await analyzeScreenshot(base64Data, file.type);
            setScreenshotPreview(result.extractedText);
            setAnalysis({ tone: result.tone, mood: result.mood, replyStyles: result.replyStyles, replies: result.replies });
            setReplies(result.replies ?? []);
            setAnalysisStore({ tone: result.tone, mood: result.mood, replyStyles: result.replyStyles, extractedText: result.extractedText });
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Screenshot analysis failed';
            setAnalysisError(message);
            console.error('Screenshot analysis error:', error);
          } finally {
            setScreenshotLoading(false);
          }
        };
        reader.readAsDataURL(file);
      };
      input.click();
      return;
    }

    // Native mobile
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

    // Analyze immediately (inline, no DB writes)
    try {
      setScreenshotLoading(true);
      const result = await analyzeScreenshot(asset.base64, asset.mimeType ?? 'image/jpeg');
      setScreenshotPreview(result.extractedText);
      setAnalysis({ tone: result.tone, mood: result.mood, replyStyles: result.replyStyles, replies: result.replies });
      setReplies(result.replies ?? []);
      setAnalysisStore({ tone: result.tone, mood: result.mood, replyStyles: result.replyStyles, extractedText: result.extractedText });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Screenshot analysis failed';
      setAnalysisError(message);
      console.error('Screenshot analysis error:', error);
    } finally {
      setScreenshotLoading(false);
    }
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
      
      // Intentionally do not persist analysis for inline assistant
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

  

  return (
    <ScreenContainer scrollable={false} className="bg-background">
      <View className="flex-row items-center justify-between py-4 h-16">
        <View className="flex-1" />
        <View className="absolute inset-x-0 items-center pointer-events-none">
          <Text variant="headline" className="text-2xl tracking-tighter">Stitch Noir</Text>
        </View>
        <View className="flex-row items-center gap-4">
          <Pressable className="p-2 rounded-lg active:bg-surface-high" onPress={() => router.push('/settings')}>
            <Settings size={22} color="#f5f5f5" />
          </Pressable>
        </View>
      </View>

      {/* Chat display area */}
      <View className="flex-1 px-2 py-2">
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 8, paddingTop: 8, paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {historyMessages.map((msg) => (
            <View key={msg.id} className="mb-4">
              {msg.input ? (
                <View className="items-end">
                  <Text size="sm" className="mb-2 text-on-surface-variant">Your message</Text>
                  <View className="max-w-[82%] rounded-[20px] border border-primary/30 bg-primary/20 p-4">
                    <Text className="text-white/95">{msg.input}</Text>
                  </View>
                </View>
              ) : null}

              {msg.screenshotAsset ? (
                <View className="mt-3 mb-3 rounded-2xl border border-outline-variant bg-background/30 p-2">
                  <Text size="sm" className="mb-2 text-on-surface-variant">Image message</Text>
                  <Image source={{ uri: msg.screenshotAsset.uri }} className="w-full h-56 rounded-xl" resizeMode="contain" />
                  {msg.screenshotPreview ? (
                    <Text size="xs" className="mt-2 text-on-surface-variant">
                      {msg.screenshotPreview}
                    </Text>
                  ) : null}
                </View>
              ) : null}

              {msg.replies?.length > 0 ? (
                <View className="mt-3">
                  {msg.replies.map((r: string, idx: number) => (
                    <View key={`${msg.id}-r-${idx}`} className="mb-3 items-start">
                      <View className="max-w-[82%] rounded-[20px] border border-outline-variant bg-surface-container-lowest/80 p-4">
                        <View className="flex-row items-start justify-between">
                          <View className="flex-1">
                            <Text className="text-white/95">{r}</Text>
                          </View>
                          <View className="ml-3 flex-row gap-2">
                            <CopyButton value={r} />
                            <Pressable onPress={() => openRefineModal(msg.id, idx, r)} className="rounded-full bg-white/5 p-2 border border-white/10">
                              <Text size="xs">Refine</Text>
                            </Pressable>
                          </View>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          ))}

          {conversation ? (
            <View className="mb-4 items-end">
              <Text size="sm" className="mb-2 text-on-surface-variant">Your message</Text>
              <View className="max-w-[82%] rounded-[20px] border border-primary/30 bg-primary/20 p-4">
                <Text className="text-white/95">{conversation}</Text>
              </View>
            </View>
          ) : null}

          {replies.length > 0 && analysis ? (
            <View>
              <Text size="sm" className="text-on-surface-variant mb-3 uppercase tracking-wider">Suggested replies</Text>
              <View className="gap-3">
                {replies.slice(0, 3).map((reply, index) => {
                  const toneLabel = analysis.replyStyles?.[index] ?? analysis.tone ?? 'Tone';

                  return (
                    <View key={`${reply}-${index}`} className="items-start">
                      <View className="max-w-[82%] rounded-[20px] border border-outline-variant bg-surface-container-lowest/80 p-4">
                        <View className="flex-row items-start justify-between">
                          <View className="flex-1">
                            <Text className="text-white/95">{reply}</Text>
                            <View className="mt-2 flex-row items-center gap-2">
                              <View className="rounded-full border border-outline-variant bg-background/40 px-2.5 py-1">
                                <Text size="xs" className="text-primary">{toneLabel}</Text>
                              </View>
                            </View>
                          </View>
                          <View className="ml-3 flex-row items-center gap-2">
                            <CopyButton value={reply} />
                            <Pressable
                              onPress={() => openRefineModal('current', index, reply)}
                              className="rounded-full bg-white/5 px-3 py-2"
                            >
                              <Text size="xs">Refine</Text>
                            </Pressable>
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null}

          {!conversation && replies.length === 0 && historyMessages.length === 0 ? (
            <View className="items-center justify-center py-20">
              <Text className="text-on-surface-variant/70 text-center">Start chatting below</Text>
            </View>
          ) : null}
        </ScrollView>
      </View>

      {/* Input section - bottom */}
        <View className="mt-auto mb-2">
          <View className="rounded-[32px] border border-outline-variant bg-surface-container px-4 py-3 shadow-lg shadow-black/20">
            {Platform.OS === 'web' ? (
              <View className="flex-row items-center gap-3">
                <Pressable
                  onPress={handlePickScreenshot}
                  className="h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-background/40 active:bg-white/10"
                >
                  <Paperclip size={22} color="#d3bbff" />
                </Pressable>

                <TextInput
                  value={conversation}
                  onChangeText={setConversation}
                  multiline={false}
                  returnKeyType="send"
                  onSubmitEditing={() => void handleSendMessage()}
                  blurOnSubmit
                  placeholder="Paste or type a conversation..."
                  placeholderTextColor="#8f879b"
                  className="h-11 flex-1 text-base text-on-surface pl-0.5"
                />

                <Pressable
                  onPress={handleSendMessage}
                  disabled={analysisLoading}
                  className={`h-11 w-11 items-center justify-center rounded-full ${analysisLoading ? 'bg-white/5' : conversation.trim() || screenshotAsset ? 'bg-primary' : 'bg-white/10'}`}
                >
                  {analysisLoading ? <ActivityIndicator color="#f4effe" /> : <ArrowUp size={18} color={conversation.trim() || screenshotAsset ? '#120f16' : '#d9d3e3'} />}
                </Pressable>
              </View>
            ) : (
              <View className="flex-row items-center gap-3">
                <Pressable className="px-3 py-2 rounded-full bg-background/30 mr-3">
                  <Plus size={20} color="#d3bbff" />
                </Pressable>
                <TextInput
                  value={conversation}
                  onChangeText={setConversation}
                  multiline={false}
                  returnKeyType="send"
                  onSubmitEditing={() => void handleSendMessage()}
                  blurOnSubmit
                  placeholder="Ask anything"
                  placeholderTextColor="#bfb7c9"
                  className="flex-1 text-base text-on-surface"
                />
                <View className="flex-row items-center gap-3 ml-3">
                  <Pressable onPress={() => {}} className="p-2 rounded-full bg-background/20">
                    <ChevronDown size={16} color="#958da1" />
                  </Pressable>
                  <Pressable className="p-2 rounded-full bg-background/20">
                    <Sparkles size={16} color="#d3bbff" />
                  </Pressable>

                  <Pressable
                    onPress={handleSendMessage}
                    disabled={analysisLoading}
                    className={`h-11 w-11 items-center justify-center rounded-full ${analysisLoading ? 'bg-white/5' : conversation.trim() || screenshotAsset ? 'bg-primary' : 'bg-white/10'}`}
                  >
                    {analysisLoading ? <ActivityIndicator color="#f4effe" /> : <ArrowUp size={18} color={conversation.trim() || screenshotAsset ? '#120f16' : '#d9d3e3'} />}
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </View>

      {analysisError ? (
        <Card className="mt-4 p-4 bg-red-500/10 border border-red-500/30">
          <Text className="text-red-200">{analysisError}</Text>
        </Card>
      ) : null}

      {/* Refine modal */}
      <Modal visible={refineModalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-surface-container p-4 rounded-t-2xl">
            <Text variant="label" className="mb-2">Refine Reply</Text>
            <TextInput
              multiline
              value={refineInstruction}
              onChangeText={setRefineInstruction}
              placeholder="Instructions (e.g. make it friendlier, add detail...)"
              className="min-h-[80px] text-on-surface bg-transparent border border-outline-variant p-2 rounded"
            />
            <View className="mt-3">
              <Text size="xs" className="text-on-surface-variant mb-2">Target tone</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-2 px-2">
                <View className="flex-row gap-2">
                  {['Casual', 'Friendly', 'Playful', 'Teasing', 'Enthusiastic'].map((t) => (
                    <Pressable key={t} onPress={() => setRefineTone(t)} className={`px-4 py-2 rounded-full border ${refineTone === t ? 'bg-primary-container border-primary' : 'bg-surface-low border-outline-variant'}`}>
                      <Text className={refineTone === t ? 'text-on-primary-container' : 'text-on-surface'}>{t}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View className="mt-4 flex-row justify-end gap-3">
              <Pressable onPress={() => setRefineModalVisible(false)} className="px-4 py-2 rounded-full bg-white/5">
                <Text>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleApplyRefine} className="px-4 py-2 rounded-full bg-primary">
                {refineLoading ? <ActivityIndicator color="#120f16" /> : <Text weight="bold">Apply</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>




      

      
    </ScreenContainer>
  );
}
