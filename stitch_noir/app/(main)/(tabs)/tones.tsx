import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  FlatList,
  KeyboardAvoidingView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  useWindowDimensions,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import { Text } from '@/components/ui/Text';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { ModernComposer } from '@/components/ui/ModernComposer';
import { ThemedDialog } from '@/components/ui/ThemedDialog';
import { ChatMessageBubble } from '@/components/tones/ChatMessageBubble';
import { MemoryDrawer } from '@/components/tones/MemoryDrawer';
import {
  Settings,
  Plus,
  Paperclip,
  Sparkles,
  ChevronDown,
  ArrowUp,
  Search,
  UploadCloud,
  Menu,
  AlertCircle,
  Trash2,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { CHOCOLATE_TRUFFLE_DARK, CHOCOLATE_TRUFFLE_LIGHT } from '@/theme/palette';
import * as DocumentPicker from 'expo-document-picker';
import {
  fetchWorkspaceChats,
  fetchWorkspaceMessages,
  fetchWorkspaceUploads,
  createWorkspaceChat,
  renameWorkspaceChat,
  deleteWorkspaceChat,
  reindexWorkspaceUpload,
  removeWorkspaceUpload,
  updateChatTitleIfNeeded,
  uploadWorkspaceFile,
  loadCachedChats,
  type WorkspaceChat,
  type WorkspaceMessage,
  type WorkspaceUpload,
} from '@/services/chatWorkspace';
import { generateText } from '@/services/gemini';
import { getUploadContentKind, isSupportedUpload, type UploadSource } from '@/lib/file-processing';
import { getToneOptions, getToneConversationPrompt, normalizeToneName, getToneHint } from '@/lib/tonePrompts';
import { useAppStore } from '@/store/useAppStore';

const MESSAGE_PAGE_SIZE = 30;

type ChatGroup = {
  label: string;
  items: WorkspaceChat[];
};

type PendingUpload = {
  id: string;
  filename: string;
  fileType: string;
  uri?: string;
  status: 'uploading' | 'processing';
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
  const { width } = useWindowDimensions();
  const isCompactMobile = width < 420;
  const themeMode = useAppStore((state) => state.themeMode);
  const isLight = themeMode === 'light';
  const activeTone = useAppStore((state) => state.activeTone);
  const toneProfile = useAppStore((state) => state.toneProfile);
  const activeChatId = useAppStore((state) => state.activeChatId);
  const setActiveTone = useAppStore((state) => state.setActiveTone);
  const setActiveChatId = useAppStore((state) => state.setActiveChatId);
  const user = useAppStore((state) => state.user);

  const [chats, setChats] = useState<WorkspaceChat[]>([]);
  const [messages, setMessages] = useState<WorkspaceMessage[]>([]);
  const [uploads, setUploads] = useState<WorkspaceUpload[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(activeChatId);
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
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{ kind: 'chat'; chat: WorkspaceChat } | { kind: 'upload'; upload: WorkspaceUpload } | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [dialog, setDialog] = useState<{ title: string; message: string; tone: 'info' | 'success' | 'danger'; icon: typeof AlertCircle } | null>(null);
  const messageCacheRef = useRef(new Map<string, WorkspaceMessage[]>());
  const uploadCacheRef = useRef(new Map<string, WorkspaceUpload[]>());

  const toneOptions = useMemo(() => getToneOptions(toneProfile), [toneProfile]);
  const selectedTone = normalizeToneName(activeTone);
  const hasDraftText = draft.trim().length > 0;

  useEffect(() => {
    if (activeTone !== selectedTone) {
      setActiveTone(selectedTone);
    }
  }, [activeTone, selectedTone, setActiveTone]);

  useEffect(() => {
    if (activeChatId && activeChatId !== selectedChatId) {
      setSelectedChatId(activeChatId);
    }
  }, [activeChatId, selectedChatId]);

  const selectedChat = useMemo(
    () => chats.find((chat) => chat.id === selectedChatId) ?? null,
    [chats, selectedChatId]
  );

  const showInitialLoading = loadingChats && chats.length === 0;

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
        setActiveChatId(nextChats[0].id);
      }
    } catch (error) {
      setDialog({
        title: 'Chats unavailable',
        message: error instanceof Error ? error.message : 'Could not load chats.',
        tone: 'danger',
        icon: AlertCircle,
      });
    } finally {
      setLoadingChats(false);
    }
  }, [searchText, selectedChatId]);

  const refreshMessages = useCallback(async (chatId: string, options: { showLoading?: boolean } = {}) => {
    const showLoading = options.showLoading ?? true;
    if (showLoading) {
      setLoadingMessages(true);
    }
    setHasMoreMessages(true);
    try {
      const [messageResult, uploadResult] = await Promise.all([
        fetchWorkspaceMessages(chatId, { limit: MESSAGE_PAGE_SIZE }),
        fetchWorkspaceUploads(chatId),
      ]);

      if (messageResult.error) {
        throw messageResult.error;
      }

      const nextMessages = (messageResult.data ?? []).slice().reverse();
      const nextUploads = uploadResult.data ?? [];
      messageCacheRef.current.set(chatId, nextMessages);
      uploadCacheRef.current.set(chatId, nextUploads);
      setMessages(nextMessages);
      setUploads(nextUploads);
      setHasMoreMessages((messageResult.data ?? []).length === MESSAGE_PAGE_SIZE);
    } catch (error) {
      setDialog({
        title: 'Conversation unavailable',
        message: error instanceof Error ? error.message : 'Could not load messages.',
        tone: 'danger',
        icon: AlertCircle,
      });
    } finally {
      if (showLoading) {
        setLoadingMessages(false);
      }
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: false }));
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const cached = await loadCachedChats();
      if (mounted && cached && cached.length > 0) {
        setChats(cached);
        if (!selectedChatId) {
          setSelectedChatId(cached[0].id);
          setActiveChatId(cached[0].id);
        }
      }
      void refreshChats();
    })();

    return () => {
      mounted = false;
    };
  }, [refreshChats]);

  useEffect(() => {
    if (selectedChatId) {
      const cachedMessages = messageCacheRef.current.get(selectedChatId);
      const cachedUploads = uploadCacheRef.current.get(selectedChatId);

      if (cachedMessages) {
        setMessages(cachedMessages);
        setUploads(cachedUploads ?? []);
        setHasMoreMessages(cachedMessages.length === MESSAGE_PAGE_SIZE);
        void refreshMessages(selectedChatId, { showLoading: false });
      } else {
        void refreshMessages(selectedChatId);
      }
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
      setActiveChatId(created.data.id);
      setActiveChatId(created.data.id);
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
      const pendingId = `pending-${Date.now()}`;

      if (!isSupportedUpload(filename, mimeType)) {
        Alert.alert('Unsupported file', 'Please upload txt, md, pdf, docx, png, jpg, or jpeg files.');
        return;
      }

      setIsUploading(true);
      setComposerNotice(`Uploading ${filename}...`);
      setPendingUploads((current) => [
        { id: pendingId, filename, fileType: mimeType, uri: asset.uri, status: 'uploading' },
        ...current,
      ]);
      stopProgress = startUploadProgress(filename);
      await uploadWorkspaceFile(asset as UploadSource, chatId);
      const uploadResult = await fetchWorkspaceUploads(chatId);
      if (uploadResult.data) {
        setUploads(uploadResult.data);
      }
      setPendingUploads((current) => current.filter((item) => item.id !== pendingId));
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
      setPendingUploads([]);
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
        const pendingId = `pending-${Date.now()}`;

        if (!isSupportedUpload(filename, mimeType)) {
          Alert.alert('Unsupported file', 'Please upload txt, md, pdf, docx, png, jpg, or jpeg files.');
          return;
        }

        setIsUploading(true);
        setComposerNotice(`Uploading ${filename}...`);
        setPendingUploads((current) => [
          { id: pendingId, filename, fileType: mimeType, uri: URL.createObjectURL(file), status: 'uploading' },
          ...current,
        ]);
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
        setPendingUploads((current) => current.filter((item) => item.id !== pendingId));
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
        setPendingUploads([]);
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

      // update local list and refresh from server to ensure ordering and timestamps
      setChats((current) => current.map((chat) => (chat.id === renameChat.id ? { ...chat, title: nextTitle } : chat)));
      setRenameChat(null);
      setRenameValue('');
      void refreshChats();
    } catch (error) {
      Alert.alert('Rename failed', error instanceof Error ? error.message : 'Could not rename chat.');
    }
  }, [renameChat, renameValue, refreshChats]);

  const confirmDeleteChat = useCallback((chat: WorkspaceChat) => {
    setDeleteTarget({ kind: 'chat', chat });
  }, []);

  const confirmDeleteUpload = useCallback((upload: WorkspaceUpload) => {
    setDeleteTarget({ kind: 'upload', upload });
  }, []);

  const handleDeleteTarget = useCallback(async () => {
    if (!deleteTarget || deleteBusy) {
      return;
    }

    setDeleteBusy(true);
    try {
      if (deleteTarget.kind === 'chat') {
        const { error } = await deleteWorkspaceChat(deleteTarget.chat.id);
        if (error) {
          throw error;
        }

        void refreshChats();
        setUploads((current) => current.filter((upload) => upload.chat_id !== deleteTarget.chat.id));
        if (selectedChatId === deleteTarget.chat.id) {
          setSelectedChatId(null);
          setActiveChatId(null);
          setMessages([]);
          setUploads([]);
        }
      } else {
        const result = await removeWorkspaceUpload(deleteTarget.upload);
        if (result.error) {
          throw result.error;
        }

        if (selectedChatId) {
          const uploadResult = await fetchWorkspaceUploads(selectedChatId);
          setUploads(uploadResult.data ?? []);
        }
      }

      setDeleteTarget(null);
    } catch (deleteError) {
      setDeleteTarget(null);
      setDialog({
        title: 'Delete failed',
        message: deleteError instanceof Error ? deleteError.message : 'Could not delete the item.',
        tone: 'danger',
        icon: AlertCircle,
      });
    } finally {
      setDeleteBusy(false);
    }
  }, [deleteBusy, deleteTarget, refreshChats, selectedChatId, setActiveChatId]);

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
      setComposerNotice('Typing...');
      setIsStreaming(true);
      setStreamingText('');

      setMessages((current) => [
        ...current,
        {
          id: `local-user-${Date.now()}`,
          chat_id: chatId,
          user_id: user?.id ?? 'local',
          role: 'user',
          content: trimmed,
          created_at: new Date().toISOString(),
        },
      ]);

      // build compact context from last messages to keep replies relevant
      const recent = messages
        .slice(-6)
        .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n');

      const prompt = [
        getToneConversationPrompt(selectedTone),
        'Respond directly to the latest user message and use the recent conversation for context.',
        'Keep it natural and short (one short text message).',
        'Do not introduce unrelated topics or explain yourself.',
        recent ? `Conversation context:\n${recent}` : '',
        `User message: ${trimmed}`,
        'Return only the reply text.',
      ]
        .filter(Boolean)
        .join('\n\n');

      const assistantText = (await generateText(prompt)).trim();
      const replyText = assistantText || 'Got you.';

      setStreamingText(replyText);
      setMessages((current) => [
        ...current,
        {
          id: `local-assistant-${Date.now()}`,
          chat_id: chatId,
          user_id: user?.id ?? 'local',
          role: 'assistant',
          content: replyText,
          created_at: new Date().toISOString(),
        },
      ]);

      setStreamingText('');
      const latest = chats.find((chat) => chat.id === chatId) ?? selectedChat;
      if (!latest || latest.title === 'New chat') {
        const nextTitle = normalizeTitle(trimmed);
        await updateChatTitleIfNeeded(chatId, nextTitle);
        void refreshChats();
      }
    } catch (error) {
      Alert.alert('Message failed', error instanceof Error ? error.message : 'Could not send the message.');
    } finally {
      setIsStreaming(false);
      setComposerNotice('');
    }
  }, [chats, draft, ensureChat, refreshChats, selectedTone, selectedChat, user?.id]);

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
        <View className="relative flex-row items-center justify-between border-b border-border px-4 py-3">
          <View className="flex-1 flex-row items-center">
            {isCompactMobile ? (
              <Pressable
                onPress={() => router.push('/memory' as never)}
                hitSlop={12}
                className="h-11 w-11 items-center justify-center rounded-full border border-border bg-bg-elevated/30 active:bg-bg-elevated"
              >
                <Menu size={18} color={isLight ? '#1A1A1A' : '#FDFBD4'} />
              </Pressable>
            ) : null}
          </View>
          <View className="absolute inset-x-0 items-center pointer-events-none">
            <View className="flex-row items-center">
              <Text variant="headline" className="text-2xl tracking-tighter text-text-primary">
                RIZZ
              </Text>
            </View>
          </View>
          <View className="flex-row items-center gap-3">
            <Pressable className="p-2 rounded-lg active:bg-surface-high" onPress={() => router.push('/settings')}>
              <Settings size={22} color={isLight ? '#1A1A1A' : '#FDFBD4'} />
            </Pressable>
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
            setActiveChatId(chatId);
            setIsMemoryDrawerOpen(false);
          }}
          onRenameChat={handleRenameChat}
          onDeleteChat={confirmDeleteChat}
        />

        <View className="flex-1 bg-background">
              {showInitialLoading ? (
                <View className="flex-1 items-center justify-center px-8 py-12">
                  <ActivityIndicator color={isLight ? '#713600' : '#FDFBD4'} size="large" />
                </View>
              ) : selectedChat ? (
              <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={0}
              >
                <View className="flex-1 px-2 py-2">
                  <View className="mb-4 flex-row items-center justify-between gap-3 px-4 py-3">
                    <View className="flex-1">
                      <Text weight="bold" size="xl" numberOfLines={1}>
                        {selectedChat.title}
                      </Text>
                    </View>
                    <Pressable onPress={() => void handleNewChat()} className="rounded-full border border-border bg-bg-elevated px-3 py-2 active:bg-white/10">
                      <View className="flex-row items-center gap-2">
                        <Plus size={14} color={isLight ? '#1A1A1A' : '#FDFBD4'} />
                        <Text size="sm">New chat</Text>
                      </View>
                    </Pressable>
                  </View>

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
                    contentContainerStyle={{ paddingHorizontal: 8, paddingTop: 8, paddingBottom: 16 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    ListHeaderComponent={
                      loadingMessages ? (
                          <View className="items-center py-8">
                          <ActivityIndicator color={isLight ? '#713600' : '#FDFBD4'} />
                        </View>
                      ) : null
                    }
                    ListFooterComponent={
                      <>
                        {loadingOlder ? (
                          <View className="items-center py-4">

                    {uploads.length > 0 ? (
                      <View className="mt-4 rounded-[28px] border border-border bg-bg-elevated/60 p-4">
                        <View className="mb-3 flex-row items-center justify-between">
                          <Text weight="bold" size="sm" className="text-text-secondary uppercase tracking-widest">
                            This chat's uploads
                          </Text>
                          <Pressable onPress={handlePickUpload} className="rounded-full border border-border px-3 py-1.5 active:bg-white/10">
                            <Text size="xs">Add file</Text>
                          </Pressable>
                        </View>
                        <View className="gap-2">
                              {pendingUploads.map((upload) => (
                                <View key={upload.id} className="rounded-2xl border border-dashed border-border bg-accent/5 p-3">
                                  <View className="flex-row items-center justify-between gap-3">
                                    <View className="flex-1">
                                      <Text weight="semibold" numberOfLines={1}>
                                        {upload.filename}
                                      </Text>
                                      <Text size="xs" className="mt-1 text-text-secondary">
                                        {upload.status === 'uploading' ? 'Uploading...' : 'Processing...'}
                                      </Text>
                                    </View>
                                    {upload.uri && upload.fileType.startsWith('image/') ? (
                                      <Image source={{ uri: upload.uri }} className="h-14 w-14 rounded-lg" />
                                    ) : null}
                                  </View>
                                </View>
                              ))}
                          {uploads.map((upload) => (
                            <View key={upload.id} className="rounded-2xl border border-border bg-bg-elevated p-3">
                              <View className="flex-row items-start justify-between gap-3">
                                <View className="flex-1">
                                  <Text weight="semibold" numberOfLines={1}>
                                    {upload.filename}
                                  </Text>
                                  <Text size="xs" className="mt-1 text-text-secondary">
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
                                    <Search size={14} color={isLight ? '#1A1A1A' : '#FDFBD4'} />
                                  </Pressable>
                                  <Pressable
                                    onPress={() => confirmDeleteUpload(upload)}
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
                              <ActivityIndicator color={isLight ? '#713600' : '#FDFBD4'} size="small" />
                            </View>
                          ) : null}
                        {isStreaming ? (
                          <ChatMessageBubble role="assistant" content={streamingText || 'Typing...'} streaming />
                        ) : null}
                      </>
                    }
                    onContentSizeChange={() => {
                      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: false }));
                    }}
                  />
                </View>

                <View className="bg-background py-4 -mx-margin-mobile">
                  {uploadProgress !== null ? (
                    <View className="mb-3 rounded-2xl border border-border bg-bg-elevated px-4 py-3">
                      <View className="mb-2 flex-row items-center justify-between gap-3">
                        <Text size="sm" weight="semibold">
                          {uploadLabel || 'Uploading'}
                        </Text>
                        <Text size="xs" className="text-text-secondary">
                          {Math.round(uploadProgress)}%
                        </Text>
                      </View>
                      <View className="h-2 overflow-hidden rounded-full bg-bg-elevated">
                        <View
                          className="h-full rounded-full bg-accent"
                          style={{ width: `${Math.max(6, Math.min(100, uploadProgress))}%` }}
                        />
                      </View>
                    </View>
                  ) : null}

                  <ModernComposer
                    value={draft}
                    onChangeText={setDraft}
                    placeholder="Ask anything"
                    inputClassName="text-base leading-6 text-on-surface"
                    inputProps={{
                      returnKeyType: 'default',
                      blurOnSubmit: false,
                    }}
                    toolbarLeft={
                      <Pressable
                        onPress={handlePickUpload}
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
                        onPress={handleSendMessage}
                        disabled={isStreaming || loadingChats || isUploading}
                        style={{
                          height: 48,
                          width: 48,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 999,
                          backgroundColor: isStreaming || loadingChats || isUploading
                            ? isLight ? 'rgba(113,54,0,0.08)' : 'rgba(253,251,212,0.12)'
                            : hasDraftText
                              ? isLight ? '#713600' : '#FDFBD4'
                              : isLight ? 'rgba(113,54,0,0.08)' : 'rgba(253,251,212,0.12)'
                        }}
                      >
                        {isStreaming ? (
                          <ActivityIndicator color={isLight ? '#713600' : '#FDFBD4'} />
                        ) : (
                          <ArrowUp size={18} color={hasDraftText ? (isLight ? '#FDFBD4' : '#38240D') : (isLight ? '#6B4A26' : '#C58C5A')} />
                        )}
                      </Pressable>
                    }
                  />
                </View>
              </KeyboardAvoidingView>
            ) : (
              <View className="flex-1 items-center justify-center px-8 py-12">
                <View className="max-w-[520px] items-center px-8 py-10">
                  <View className="mt-2 flex-row flex-wrap items-center justify-center gap-3">
                    <Button label="New Chat" icon={Plus} onPress={handleNewChat} />
                    <Button label="Upload Files" icon={UploadCloud} variant="secondary" onPress={handlePickUpload} />
                  </View>
                </View>
              </View>
            )}
        </View>

        <Modal visible={Boolean(renameChat)} transparent animationType="fade" onRequestClose={() => setRenameChat(null)}>
          <Pressable className="flex-1 items-center justify-center bg-black/60 px-6" onPress={() => setRenameChat(null)}>
            <Pressable className="w-full max-w-[420px] rounded-[28px] border border-border bg-bg-elevated p-6" onPress={(event) => event.stopPropagation()}>
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
                placeholderTextColor={isLight ? '#6B4A26' : '#FDFBD4'}
                className="mt-4 rounded-2xl border border-border bg-bg-surface px-4 py-3 text-text-primary"
              />
              <View className="mt-5 flex-row items-center justify-end gap-3">
                <Button label="Cancel" variant="outline" onPress={() => setRenameChat(null)} />
                <Button label="Save" onPress={commitRename} />
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        <Modal visible={isTonePickerOpen} transparent animationType="fade" onRequestClose={() => setIsTonePickerOpen(false)}>
          <TouchableWithoutFeedback onPress={() => setIsTonePickerOpen(false)}>
            <View className="flex-1 justify-end bg-black/55 px-4 pb-6">
              <View className="overflow-hidden rounded-t-[20px] border border-border bg-bg-elevated p-4" onStartShouldSetResponder={() => true}>
              <View className="mb-3 flex-row items-center justify-between">
                <Text weight="bold" size="lg">Choose tone</Text>
                <Pressable onPress={() => setIsTonePickerOpen(false)} className="p-2">
                  <Text size="sm">Close</Text>
                </Pressable>
              </View>
              <Text className="mb-3 text-on-surface-variant">Replies will follow the selected prompt style.</Text>
              <View className="mt-2">
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="-mx-5 px-5"
                  contentContainerStyle={{ paddingRight: 40 }}
                >
                  <View className="flex-row gap-2">
                    {toneOptions.map((tone) => {
                      const isSelected = tone === selectedTone;
                      const bgColor = isSelected ? (isLight ? CHOCOLATE_TRUFFLE_LIGHT.accent : CHOCOLATE_TRUFFLE_DARK.accent) : undefined;
                      const borderColor = isSelected ? (isLight ? CHOCOLATE_TRUFFLE_LIGHT.accent : CHOCOLATE_TRUFFLE_DARK.accent) : undefined;
                      const textColor = isSelected ? (isLight ? CHOCOLATE_TRUFFLE_LIGHT.bgPrimary : CHOCOLATE_TRUFFLE_DARK.bgPrimary) : undefined;
                      return (
                        <Pressable
                          key={tone}
                          onPress={() => {
                            setActiveTone(tone);
                            setIsTonePickerOpen(false);
                          }}
                          style={{
                            paddingVertical: 8,
                            paddingHorizontal: 12,
                            borderRadius: 999,
                            borderColor,
                            backgroundColor: bgColor,
                          }}
                        >
                          <Text weight="bold" size="sm" style={textColor ? { color: textColor } : undefined}>{tone}</Text>
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

        <ThemedDialog
          visible={Boolean(deleteTarget)}
          title={deleteTarget?.kind === 'upload' ? 'Delete upload?' : 'Delete chat?'}
          message={
            deleteTarget?.kind === 'upload'
              ? `Remove ${deleteTarget.upload.filename} from this workspace?`
              : deleteTarget
                ? `Remove ${deleteTarget.chat.title} and all of its messages?`
                : ''
          }
          tone="danger"
          icon={Trash2}
          primaryAction={{
            label: deleteBusy ? 'Deleting...' : 'Delete',
            onPress: () => void handleDeleteTarget(),
            loading: deleteBusy,
          }}
          secondaryAction={{
            label: 'Cancel',
            onPress: () => setDeleteTarget(null),
            disabled: deleteBusy,
          }}
          dismissible={!deleteBusy}
          onRequestClose={() => {
            if (!deleteBusy) {
              setDeleteTarget(null);
            }
          }}
        />

        {dialog ? (
          <ThemedDialog
            visible={Boolean(dialog)}
            title={dialog.title}
            message={dialog.message}
            tone={dialog.tone}
            icon={dialog.icon}
            primaryAction={{ label: 'OK', onPress: () => setDialog(null) }}
            onRequestClose={() => setDialog(null)}
          />
        ) : null}
      </View>
    </ScreenContainer>
  );
}
