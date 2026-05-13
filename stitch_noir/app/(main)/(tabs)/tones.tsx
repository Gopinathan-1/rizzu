import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  TextInput,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { ArrowUp, ChevronDown, Paperclip, Plus, Search, Settings, Sparkles, UploadCloud } from 'lucide-react-native';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { MemoryDrawer } from '@/components/tones/MemoryDrawer';
import { ChatMessageBubble } from '@/components/tones/ChatMessageBubble';
import {
  createWorkspaceChat,
  createWorkspaceMessage,
  deleteWorkspaceChat,
  fetchWorkspaceChats,
  fetchWorkspaceMessages,
  fetchWorkspaceUploads,
  generateChatTitle,
  reindexWorkspaceUpload,
  removeWorkspaceUpload,
  renameWorkspaceChat,
  streamWorkspaceReply,
  updateChatTitleIfNeeded,
  uploadWorkspaceFile,
  type WorkspaceChat,
  type WorkspaceMessage,
  type WorkspaceUpload,
} from '@/services/chatWorkspace';
import { getUploadContentKind, isSupportedUpload, type UploadSource } from '@/lib/file-processing';
import { TONE_OPTIONS, normalizeToneName } from '@/lib/tonePrompts';
import { useAppStore } from '@/store/useAppStore';

const MESSAGE_PAGE_SIZE = 30;

type ChatGroup = {
  label: string;
  items: WorkspaceChat[];
};

function groupChatsByRecency(chats: WorkspaceChat[]): ChatGroup[] {
  const today = new Date();
  const todayLabel = today.toDateString();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);

  const groups = new Map<string, WorkspaceChat[]>();

  for (const chat of chats) {
    const created = new Date(chat.updated_at);
    const dateLabel = created.toDateString();
    let bucket = 'Older';

    if (dateLabel === todayLabel) {
      bucket = 'Today';
    } else if (dateLabel === yesterday.toDateString()) {
      bucket = 'Yesterday';
    } else if (created >= sevenDaysAgo) {
      bucket = 'Last 7 Days';
    }

    const existing = groups.get(bucket) ?? [];
    existing.push(chat);
    groups.set(bucket, existing);
  }

  return ['Today', 'Yesterday', 'Last 7 Days', 'Older']
    .map((label) => ({ label, items: groups.get(label) ?? [] }))
    .filter((group) => group.items.length > 0);
}

function normalizeTitle(title: string) {
  return title.trim().replace(/\s+/g, ' ').slice(0, 80) || 'New chat';
}

export default function TonesScreen() {
  const router = useRouter();
  const listRef = useRef<FlatList<WorkspaceMessage>>(null);
  const activeTone = useAppStore((state) => state.activeTone);
  const setActiveTone = useAppStore((state) => state.setActiveTone);
  const user = useAppStore((state) => state.user);

  const [chats, setChats] = useState<WorkspaceChat[]>([]);
  const [messages, setMessages] = useState<WorkspaceMessage[]>([]);
  const [uploads, setUploads] = useState<WorkspaceUpload[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [draft, setDraft] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [renameChat, setRenameChat] = useState<WorkspaceChat | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [composerNotice, setComposerNotice] = useState('');
  const [isMemoryDrawerOpen, setIsMemoryDrawerOpen] = useState(false);
  const [isTonePickerOpen, setIsTonePickerOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadLabel, setUploadLabel] = useState('');

  const selectedTone = normalizeToneName(activeTone);
  const hasDraftText = draft.trim().length > 0;

  useEffect(() => {
    if (activeTone !== selectedTone) {
      setActiveTone(selectedTone);
    }
  }, [activeTone, selectedTone, setActiveTone]);

  const selectedChat = useMemo(
    () => chats.find((chat) => chat.id === selectedChatId) ?? null,
    [chats, selectedChatId]
  );

  const chatsByGroup = useMemo(() => groupChatsByRecency(chats), [chats]);

  const startUploadProgress = useCallback((label: string) => {
    setUploadLabel(label);
    setUploadProgress(8);

    let current = 8;
    const timer = setInterval(() => {
      current = Math.min(current + Math.max(3, Math.round((95 - current) / 3)), 95);
      setUploadProgress(current);
    }, 180);

    return () => clearInterval(timer);
  }, []);

  const refreshChats = useCallback(async (query = searchText) => {
    setLoadingChats(true);
    try {
      const { data, error } = await fetchWorkspaceChats(query);
      if (error) {
        throw error;
      }

      const nextChats = data ?? [];
      setChats(nextChats);

      if (!selectedChatId && nextChats.length > 0) {
        setSelectedChatId(nextChats[0].id);
      }
    } catch (error) {
      Alert.alert('Chats unavailable', error instanceof Error ? error.message : 'Could not load chats.');
    } finally {
      setLoadingChats(false);
    }
  }, [searchText, selectedChatId]);

  const refreshMessages = useCallback(async (chatId: string) => {
    setLoadingMessages(true);
    setHasMoreMessages(true);
    try {
      const [messageResult, uploadResult] = await Promise.all([
        fetchWorkspaceMessages(chatId, { limit: MESSAGE_PAGE_SIZE }),
        fetchWorkspaceUploads(chatId),
      ]);

      if (messageResult.error) {
        throw messageResult.error;
      }

      setMessages((messageResult.data ?? []).slice().reverse());
      setUploads(uploadResult.data ?? []);
      setHasMoreMessages((messageResult.data ?? []).length === MESSAGE_PAGE_SIZE);
    } catch (error) {
      Alert.alert('Conversation unavailable', error instanceof Error ? error.message : 'Could not load messages.');
    } finally {
      setLoadingMessages(false);
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: false }));
    }
  }, []);

  useEffect(() => {
    void refreshChats();
  }, [refreshChats]);

  useEffect(() => {
    if (selectedChatId) {
      void refreshMessages(selectedChatId);
    }
  }, [selectedChatId, refreshMessages]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void refreshChats(searchText);
    }, 250);

    return () => clearTimeout(timer);
  }, [refreshChats, searchText]);

  const ensureChat = useCallback(async () => {
    if (selectedChatId) {
      return selectedChatId;
    }

    const created = await createWorkspaceChat();
    if (created.error || !created.data) {
      throw created.error ?? new Error('Could not create a chat.');
    }

    setChats((current) => [created.data as WorkspaceChat, ...current]);
    setSelectedChatId(created.data.id);
    return created.data.id;
  }, [selectedChatId]);

  const handleNewChat = useCallback(async () => {
    try {
      const created = await createWorkspaceChat();
      if (created.error || !created.data) {
        throw created.error ?? new Error('Could not create a chat.');
      }

      setChats((current) => [created.data as WorkspaceChat, ...current]);
      setSelectedChatId(created.data.id);
      setMessages([]);
      setStreamingText('');
      setComposerNotice('');
    } catch (error) {
      Alert.alert('New chat failed', error instanceof Error ? error.message : 'Could not create a new chat.');
    }
  }, []);

  const handlePickUpload = useCallback(async () => {
    let stopProgress: (() => void) | null = null;
    try {
      const chatId = await ensureChat();
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
        type: [
          'text/plain',
          'text/markdown',
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/*',
        ],
      });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      const asset = result.assets[0];
      const filename = asset.name ?? 'upload';
      const mimeType = asset.mimeType ?? 'application/octet-stream';

      if (!isSupportedUpload(filename, mimeType)) {
        Alert.alert('Unsupported file', 'Please upload txt, md, pdf, docx, png, jpg, or jpeg files.');
        return;
      }

      setIsUploading(true);
      setComposerNotice(`Uploading ${filename}...`);
      stopProgress = startUploadProgress(filename);
      await uploadWorkspaceFile(asset as UploadSource, chatId);
      const uploadResult = await fetchWorkspaceUploads(chatId);
      if (uploadResult.data) {
        setUploads(uploadResult.data);
      }
      setUploadProgress(100);
      setComposerNotice(`Upload complete: ${filename}`);
      setTimeout(() => {
        setComposerNotice('');
        setUploadProgress(null);
        setUploadLabel('');
      }, 1800);
    } catch (error) {
      Alert.alert('Upload failed', error instanceof Error ? error.message : 'Could not process the file.');
      setComposerNotice('');
      setUploadProgress(null);
      setUploadLabel('');
    } finally {
      stopProgress?.();
      setIsUploading(false);
    }
  }, [ensureChat, startUploadProgress]);

  const handleDroppedWebFile = useCallback(
    async (file: File) => {
      let stopProgress: (() => void) | null = null;
      try {
        const chatId = await ensureChat();
        const filename = file.name || 'upload';
        const mimeType = file.type || 'application/octet-stream';

        if (!isSupportedUpload(filename, mimeType)) {
          Alert.alert('Unsupported file', 'Please upload txt, md, pdf, docx, png, jpg, or jpeg files.');
          return;
        }

        setIsUploading(true);
        setComposerNotice(`Uploading ${filename}...`);
        stopProgress = startUploadProgress(filename);
        await uploadWorkspaceFile({
          file,
          name: filename,
          mimeType,
          size: file.size,
        }, chatId);
        const uploadResult = await fetchWorkspaceUploads(chatId);
        if (uploadResult.data) {
          setUploads(uploadResult.data);
        }
        setUploadProgress(100);
        setComposerNotice(`Upload complete: ${filename}`);
        setTimeout(() => {
          setComposerNotice('');
          setUploadProgress(null);
          setUploadLabel('');
        }, 1800);
      } catch (error) {
        Alert.alert('Upload failed', error instanceof Error ? error.message : 'Could not process the file.');
        setComposerNotice('');
        setUploadProgress(null);
        setUploadLabel('');
      } finally {
        stopProgress?.();
        setIsUploading(false);
      }
    },
    [ensureChat, startUploadProgress]
  );

  const handleRenameChat = useCallback((chat: WorkspaceChat) => {
    setRenameChat(chat);
    setRenameValue(chat.title);
  }, []);

  const commitRename = useCallback(async () => {
    if (!renameChat) {
      return;
    }

    const nextTitle = normalizeTitle(renameValue);
    try {
      const { error } = await renameWorkspaceChat(renameChat.id, nextTitle);
      if (error) {
        throw error;
      }

      setChats((current) => current.map((chat) => (chat.id === renameChat.id ? { ...chat, title: nextTitle } : chat)));
      setRenameChat(null);
    } catch (error) {
      Alert.alert('Rename failed', error instanceof Error ? error.message : 'Could not rename chat.');
    }
  }, [renameChat, renameValue]);

  const confirmDeleteChat = useCallback((chat: WorkspaceChat) => {
    Alert.alert('Delete chat?', `Remove ${chat.title} and all of its messages?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await deleteWorkspaceChat(chat.id);
            if (error) {
              throw error;
            }

            setChats((current) => current.filter((item) => item.id !== chat.id));
            setUploads((current) => current.filter((upload) => upload.chat_id !== chat.id));
            if (selectedChatId === chat.id) {
              setSelectedChatId(null);
              setMessages([]);
              setUploads([]);
            }
          } catch (deleteError) {
            Alert.alert('Delete failed', deleteError instanceof Error ? deleteError.message : 'Could not delete the chat.');
          }
        },
      },
    ]);
  }, [selectedChatId]);

  const handleLoadOlderMessages = useCallback(async () => {
    if (!selectedChatId || !hasMoreMessages || loadingOlder || messages.length === 0) {
      return;
    }

    setLoadingOlder(true);
    try {
      const cursor = messages[0]?.created_at;
      const { data, error } = await fetchWorkspaceMessages(selectedChatId, { limit: MESSAGE_PAGE_SIZE, before: cursor });
      if (error) {
        throw error;
      }

      const older = (data ?? []).slice().reverse();
      if (older.length === 0) {
        setHasMoreMessages(false);
        return;
      }

      setMessages((current) => [...older, ...current]);
      setHasMoreMessages(older.length === MESSAGE_PAGE_SIZE);
    } catch (error) {
      Alert.alert('Load more failed', error instanceof Error ? error.message : 'Could not load older messages.');
    } finally {
      setLoadingOlder(false);
    }
  }, [hasMoreMessages, loadingOlder, messages, selectedChatId]);

  const handleSendMessage = useCallback(async () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      return;
    }

    try {
      const chatId = await ensureChat();
      setDraft('');
      setComposerNotice('Thinking...');
      setIsStreaming(true);
      setStreamingText('');

      const userMessage = await createWorkspaceMessage(chatId, 'user', trimmed);
      if (userMessage.data) {
        setMessages((current) => [...current, userMessage.data as WorkspaceMessage]);
      }

      const streamResponse = await streamWorkspaceReply({
        chatId,
        message: trimmed,
        tone: selectedTone,
      });

      // Check response status
      if (!streamResponse.ok) {
        const errorText = await streamResponse.text();
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || `Server error: ${streamResponse.status}`);
        } catch {
          throw new Error(errorText || `Server error: ${streamResponse.status}`);
        }
      }

      if (!streamResponse.body) {
        const text = await streamResponse.text();
        setStreamingText(text);
      } else {
        const reader = streamResponse.body.getReader();
        const decoder = new TextDecoder();
        let responseText = '';
        const timeoutMs = 60000; // 60 second timeout
        const startTime = Date.now();

        try {
          while (true) {
            // Check for timeout
            if (Date.now() - startTime > timeoutMs) {
              throw new Error('Stream response took too long (> 60 seconds)');
            }

            const { done, value } = await reader.read();
            if (done) {
              break;
            }

            if (value) {
              responseText += decoder.decode(value, { stream: true });
              setStreamingText(responseText);
            }
          }

          // Flush any remaining bytes
          responseText += decoder.decode();
          setStreamingText(responseText);
        } catch (streamError) {
          reader.cancel();
          throw streamError;
        }
      }

      setStreamingText('');
      await refreshMessages(chatId);
      const latest = chats.find((chat) => chat.id === chatId) ?? selectedChat;
      const titleCandidate = latest?.title ?? 'New chat';
      if (!latest || latest.title === 'New chat') {
        try {
          const generatedTitle = await generateChatTitle(trimmed);
          const parsedTitle = generatedTitle.match(/"title"\s*:\s*"([^"]+)"/)?.[1] ?? generatedTitle.replace(/[{}]/g, '').replace(/title\s*:\s*/i, '').trim();
          if (parsedTitle) {
            await updateChatTitleIfNeeded(chatId, normalizeTitle(parsedTitle));
            void refreshChats();
          }
        } catch {
          void titleCandidate;
        }
      }
    } catch (error) {
      Alert.alert('Message failed', error instanceof Error ? error.message : 'Could not send the message.');
    } finally {
      setIsStreaming(false);
      setComposerNotice('');
    }
  }, [chats, draft, ensureChat, refreshChats, refreshMessages, selectedTone, selectedChat]);

  const handleComposerKeyPress = useCallback((event: any) => {
    if (event.nativeEvent?.key === 'Enter') {
      event.preventDefault?.();
      void handleSendMessage();
    }
  }, [handleSendMessage]);

  const webDropProps =
    Platform.OS === 'web'
      ? ({
          onDragOver: (event: any) => event.preventDefault(),
          onDrop: async (event: any) => {
            event.preventDefault();
            const file = event.dataTransfer?.files?.[0] as File | undefined;
            if (file) {
              await handleDroppedWebFile(file);
            }
          },
        } as any)
      : {};

  return (
    <ScreenContainer scrollable={false} className="bg-background px-0">
      <View className="relative flex-1 bg-background" {...webDropProps}>
        <View className="relative flex-row items-center justify-between border-b border-outline-variant px-4 py-3">
          <View className="flex-1" />
          <View className="absolute inset-x-0 items-center pointer-events-none">
            <Text variant="headline" className="text-2xl tracking-tighter">
              Stitch Noir
            </Text>
          </View>
          <View className="flex-row items-center gap-3">
            <Pressable className="rounded-full border border-outline-variant px-3 py-2 active:bg-white/10" onPress={() => router.push('/settings')}>
              <View className="flex-row items-center gap-2">
                <Settings size={16} color="#d3bbff" />
                <Text size="sm">Settings</Text>
              </View>
            </Pressable>
            <View className="rounded-full border border-outline-variant px-3 py-2">
              <Text size="sm" className="text-primary">
                {user?.full_name ?? user?.email ?? 'Signed in'}
              </Text>
            </View>
          </View>
        </View>

        <MemoryDrawer
          open={isMemoryDrawerOpen}
          onOpenChange={setIsMemoryDrawerOpen}
          searchText={searchText}
          onSearchTextChange={setSearchText}
          onNewChat={handleNewChat}
          chatsByGroup={chatsByGroup}
          selectedChatId={selectedChatId}
          onSelectChat={(chatId) => {
            setSelectedChatId(chatId);
            setIsMemoryDrawerOpen(false);
          }}
          onRenameChat={handleRenameChat}
          onDeleteChat={confirmDeleteChat}
        />

        <View className="flex-1 bg-background">
            {selectedChat ? (
              <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={0}
              >
                <View className="flex-1 px-4 pt-4">
                  <View className="mb-4 flex-row items-center justify-between gap-3 rounded-3xl border border-outline-variant bg-surface-container px-4 py-3">
                    <View className="flex-1">
                      <Text weight="bold" size="xl" numberOfLines={1}>
                        {selectedChat.title}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-1 rounded-[32px] border border-outline-variant bg-surface-container/50 px-4 py-4">
                    <FlatList
                      ref={listRef}
                      data={messages}
                      keyExtractor={(item) => item.id}
                      renderItem={({ item }) => <ChatMessageBubble role={item.role} content={item.content} createdAt={item.created_at} />}
                      onScroll={({ nativeEvent }) => {
                        if (nativeEvent.contentOffset.y < 80) {
                          void handleLoadOlderMessages();
                        }
                      }}
                      scrollEventThrottle={200}
                      contentContainerStyle={{ paddingBottom: 18 }}
                      showsVerticalScrollIndicator={false}
                      keyboardShouldPersistTaps="handled"
                      ListHeaderComponent={
                        loadingMessages ? (
                          <View className="items-center py-8">
                            <ActivityIndicator color="#d3bbff" />
                          </View>
                        ) : null
                      }
                      ListFooterComponent={
                        <>
                          {loadingOlder ? (
                            <View className="items-center py-4">

                    {uploads.length > 0 ? (
                      <View className="mt-4 rounded-[28px] border border-outline-variant bg-surface-container/60 p-4">
                        <View className="mb-3 flex-row items-center justify-between">
                          <Text weight="bold" size="sm" className="text-on-surface-variant uppercase tracking-widest">
                            This chat's uploads
                          </Text>
                          <Pressable onPress={handlePickUpload} className="rounded-full border border-outline-variant px-3 py-1.5 active:bg-white/10">
                            <Text size="xs">Add file</Text>
                          </Pressable>
                        </View>
                        <View className="gap-2">
                          {uploads.map((upload) => (
                            <View key={upload.id} className="rounded-2xl border border-outline-variant bg-background p-3">
                              <View className="flex-row items-start justify-between gap-3">
                                <View className="flex-1">
                                  <Text weight="semibold" numberOfLines={1}>
                                    {upload.filename}
                                  </Text>
                                  <Text size="xs" className="mt-1 text-on-surface-variant">
                                    {upload.file_type}
                                  </Text>
                                </View>
                                <View className="flex-row items-center gap-2">
                                  <Pressable
                                    onPress={async () => {
                                      try {
                                        await reindexWorkspaceUpload(upload);
                                        const uploadResult = await fetchWorkspaceUploads(selectedChatId);
                                        setUploads(uploadResult.data ?? []);
                                      } catch (error) {
                                        Alert.alert('Re-index failed', error instanceof Error ? error.message : 'Could not re-index the upload.');
                                      }
                                    }}
                                    className="rounded-full p-2 active:bg-white/10"
                                  >
                                    <Search size={14} color="#d3bbff" />
                                  </Pressable>
                                  <Pressable
                                    onPress={async () => {
                                      try {
                                        const result = await removeWorkspaceUpload(upload);
                                        if (result.error) {
                                          throw result.error;
                                        }
                                        const uploadResult = await fetchWorkspaceUploads(selectedChatId);
                                        setUploads(uploadResult.data ?? []);
                                      } catch (error) {
                                        Alert.alert('Delete upload failed', error instanceof Error ? error.message : 'Could not delete the upload.');
                                      }
                                    }}
                                    className="rounded-full p-2 active:bg-white/10"
                                  >
                                    <Text size="xs" className="text-error">
                                      Delete
                                    </Text>
                                  </Pressable>
                                </View>
                              </View>
                            </View>
                          ))}
                        </View>
                      </View>
                    ) : null}
                              <ActivityIndicator color="#d3bbff" size="small" />
                            </View>
                          ) : null}
                          {isStreaming ? (
                            <ChatMessageBubble role="assistant" content={streamingText || 'Thinking...'} streaming />
                          ) : null}
                        </>
                      }
                      onContentSizeChange={() => {
                        requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: false }));
                      }}
                    />
                  </View>
                </View>

                <View className="border-t border-outline-variant bg-background px-4 py-4">
                  {uploadProgress !== null ? (
                    <View className="mb-3 rounded-2xl border border-outline-variant bg-surface-container-high px-4 py-3">
                      <View className="mb-2 flex-row items-center justify-between gap-3">
                        <Text size="sm" weight="semibold">
                          {uploadLabel || 'Uploading'}
                        </Text>
                        <Text size="xs" className="text-on-surface-variant">
                          {Math.round(uploadProgress)}%
                        </Text>
                      </View>
                      <View className="h-2 overflow-hidden rounded-full bg-white/10">
                        <View
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${Math.max(6, Math.min(100, uploadProgress))}%` }}
                        />
                      </View>
                    </View>
                  ) : null}
                  <View className="rounded-[28px] border border-outline-variant bg-surface-container-high px-3 py-3 shadow-lg shadow-black/20">
                    <TextInput
                      value={draft}
                      onChangeText={setDraft}
                      multiline
                      returnKeyType="send"
                      submitBehavior="submit"
                      onKeyPress={handleComposerKeyPress}
                      onSubmitEditing={() => void handleSendMessage()}
                      blurOnSubmit={false}
                      placeholder="Ask Stitch Noir anything about your memory, chats, or uploads..."
                      placeholderTextColor="#958da1"
                      className="min-h-[92px] text-base text-on-surface"
                      textAlignVertical="top"
                    />
                    <View className="mt-3 flex-row items-center justify-between gap-3">
                      <Pressable onPress={handlePickUpload} className="flex-row items-center gap-2 rounded-full border border-outline-variant px-3 py-2 active:bg-white/10">
                        <Paperclip size={16} color="#d3bbff" />
                        <Text size="sm">Upload</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => setIsTonePickerOpen(true)}
                        className="flex-row items-center gap-2 rounded-full border border-outline-variant bg-black/20 px-3 py-2 active:bg-white/10"
                      >
                        <Sparkles size={16} color="#d3bbff" />
                        <Text size="sm">{selectedTone}</Text>
                        <ChevronDown size={14} color="#958da1" />
                      </Pressable>
                      <Pressable
                        onPress={handleSendMessage}
                        disabled={isStreaming || loadingChats || isUploading}
                        className={`flex-row items-center gap-2 rounded-full px-4 py-3 ${
                          isStreaming || loadingChats || isUploading
                            ? 'bg-white/5'
                            : hasDraftText
                              ? 'bg-primary'
                              : 'bg-white/10'
                        }`}
                      >
                        {isStreaming ? (
                          <ActivityIndicator color="#f4effe" />
                        ) : (
                          <ArrowUp size={16} color={hasDraftText ? '#120f16' : '#d9d3e3'} />
                        )}
                        <Text
                          size="sm"
                          weight="bold"
                          className={
                            isStreaming || loadingChats || isUploading
                              ? 'text-on-surface-variant'
                              : hasDraftText
                                ? 'text-background'
                                : 'text-on-surface-variant'
                          }
                        >
                          Send
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </KeyboardAvoidingView>
            ) : (
              <View className="flex-1 items-center justify-center px-8 py-12">
                <View className="max-w-[520px] items-center rounded-[36px] border border-outline-variant bg-surface-container/60 px-8 py-10 text-center">
                  <View className="mb-6 h-18 w-18 items-center justify-center rounded-full bg-primary/10 px-5 py-5">
                    <Sparkles size={32} color="#d3bbff" />
                  </View>
                  <Text variant="display" className="text-center text-4xl leading-tight">
                    Start a conversation or upload files
                  </Text>
                  <Text className="mt-3 text-center text-on-surface-variant">
                    Build a personal AI memory workspace that can search previous chats, uploaded files, and long-term memory.
                  </Text>
                  <View className="mt-8 flex-row flex-wrap items-center justify-center gap-3">
                    <Button label="New Chat" icon={Plus} onPress={handleNewChat} />
                    <Button label="Upload Files" icon={UploadCloud} variant="secondary" onPress={handlePickUpload} />
                  </View>
                  {loadingChats ? (
                    <View className="mt-6 flex-row items-center gap-2">
                      <ActivityIndicator color="#d3bbff" />
                      <Text size="sm" className="text-on-surface-variant">
                        Loading your workspace...
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            )}
        </View>

        <Modal visible={Boolean(renameChat)} transparent animationType="fade" onRequestClose={() => setRenameChat(null)}>
          <Pressable className="flex-1 items-center justify-center bg-black/60 px-6" onPress={() => setRenameChat(null)}>
            <Pressable className="w-full max-w-[420px] rounded-[28px] border border-outline-variant bg-surface-container-high p-6" onPress={(event) => event.stopPropagation()}>
              <Text weight="bold" size="xl">
                Rename chat
              </Text>
              <Text className="mt-2 text-on-surface-variant">
                Give this conversation a clearer title.
              </Text>
              <TextInput
                value={renameValue}
                onChangeText={setRenameValue}
                placeholder="Chat title"
                placeholderTextColor="#958da1"
                className="mt-4 rounded-2xl border border-outline-variant bg-background px-4 py-3 text-on-surface"
              />
              <View className="mt-5 flex-row items-center justify-end gap-3">
                <Button label="Cancel" variant="outline" onPress={() => setRenameChat(null)} />
                <Button label="Save" onPress={commitRename} />
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        <Modal visible={isTonePickerOpen} transparent animationType="fade" onRequestClose={() => setIsTonePickerOpen(false)}>
          <Pressable className="flex-1 justify-end bg-black/55 px-4 pb-6" onPress={() => setIsTonePickerOpen(false)}>
            <Pressable className="overflow-hidden rounded-[28px] border border-white/10 bg-surface-container/95 p-4" onPress={(event) => event.stopPropagation()}>
              <Text weight="bold" size="xl">
                Choose tone
              </Text>
              <Text className="mt-1 text-on-surface-variant">
                Replies will follow the selected prompt style.
              </Text>
              <View className="mt-4 gap-2">
                {TONE_OPTIONS.map((tone) => {
                  const isSelected = tone === selectedTone;

                  return (
                    <Pressable
                      key={tone}
                      onPress={() => {
                        setActiveTone(tone);
                        setIsTonePickerOpen(false);
                      }}
                      className={`flex-row items-center justify-between rounded-2xl border px-4 py-3 ${
                        isSelected ? 'border-primary bg-primary/15' : 'border-outline-variant bg-background'
                      }`}
                    >
                      <Text weight="semibold">{tone}</Text>
                      {isSelected ? <Text size="xs" className="text-primary">Selected</Text> : null}
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
