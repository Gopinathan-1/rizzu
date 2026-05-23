import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Pressable, TextInput, Alert, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Plus, Search } from 'lucide-react-native';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { ChatSidebar } from '@/components/tones/ChatSidebar';
import {
  createWorkspaceChat,
  deleteWorkspaceChat,
  fetchWorkspaceChats,
  renameWorkspaceChat,
  loadCachedChats,
  type WorkspaceChat,
} from '@/services/chatWorkspace';
import { useAppStore } from '@/store/useAppStore';

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

export default function MemoryScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isCompactMobile = width < 420;
  const themeMode = useAppStore((state) => state.themeMode);
  const isLight = themeMode === 'light';
  const activeChatId = useAppStore((state) => state.activeChatId);
  const setActiveChatId = useAppStore((state) => state.setActiveChatId);
  const [searchText, setSearchText] = useState('');
  const [chats, setChats] = useState<WorkspaceChat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(activeChatId);
  const [loading, setLoading] = useState(true);

  const chatsByGroup = useMemo(() => groupChatsByRecency(chats), [chats]);

  useEffect(() => {
    if (activeChatId && activeChatId !== selectedChatId) {
      setSelectedChatId(activeChatId);
    }
  }, [activeChatId, selectedChatId]);

  const refreshChats = useCallback(async (query = searchText) => {
    setLoading(true);
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
      Alert.alert('Chats unavailable', error instanceof Error ? error.message : 'Could not load chats.');
    } finally {
      setLoading(false);
    }
  }, [searchText, selectedChatId, setActiveChatId]);

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
    const timer = setTimeout(() => {
      void refreshChats(searchText);
    }, 250);

    return () => clearTimeout(timer);
  }, [refreshChats, searchText]);

  const handleNewChat = useCallback(async () => {
    try {
      const created = await createWorkspaceChat();
      if (created.error || !created.data) {
        throw created.error ?? new Error('Could not create a chat.');
      }

      setChats((current) => [created.data as WorkspaceChat, ...current]);
      setSelectedChatId(created.data.id);
      setActiveChatId(created.data.id);
      router.replace('/(main)/(tabs)/tones');
    } catch (error) {
      Alert.alert('New chat failed', error instanceof Error ? error.message : 'Could not create a new chat.');
    }
  }, [router, setActiveChatId]);

  const handleRenameChat = useCallback((chat: WorkspaceChat) => {
    const nextTitle = normalizeTitle(chat.title);
    if (nextTitle === chat.title) {
      return;
    }

    void (async () => {
      try {
        const { error } = await renameWorkspaceChat(chat.id, nextTitle);
        if (error) {
          throw error;
        }

        setChats((current) => current.map((item) => (item.id === chat.id ? { ...item, title: nextTitle } : item)));
      } catch (error) {
        Alert.alert('Rename failed', error instanceof Error ? error.message : 'Could not rename chat.');
      }
    })();
  }, []);

  const handleDeleteChat = useCallback((chat: WorkspaceChat) => {
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
            if (selectedChatId === chat.id) {
              setSelectedChatId(null);
              setActiveChatId(null);
            }
          } catch (error) {
            Alert.alert('Delete failed', error instanceof Error ? error.message : 'Could not delete the chat.');
          }
        },
      },
    ]);
  }, [selectedChatId, setActiveChatId]);

  const handleSelectChat = useCallback((chatId: string) => {
    setSelectedChatId(chatId);
    setActiveChatId(chatId);
    router.replace('/(main)/(tabs)/tones');
  }, [router, setActiveChatId]);

  return (
    <ScreenContainer scrollable={false} className="bg-background px-0">
      <View className="flex-1 bg-background">
        <View className="flex-row items-center justify-between border-b border-outline-variant px-4 py-3">
          <Pressable
            onPress={() => router.replace('/(main)/(tabs)/tones')}
            hitSlop={12}
            className="h-11 w-11 items-center justify-center rounded-full border border-outline-variant bg-background/30 active:bg-white/10"
          >
            <ChevronLeft size={20} color={isLight ? '#1A1A1A' : '#FDFBD4'} />
          </Pressable>

          <View className="items-center">
            <Text variant="headline" className="text-xl tracking-tighter">
              Memory
            </Text>
            <Text size="xs" className="text-on-surface-variant">
              Chats and workspace history
            </Text>
          </View>

          <View className="w-11" />
        </View>

        <View className="border-b border-outline-variant px-4 py-4">
          <View className="mb-3 flex-row items-center justify-between gap-3">
            <View className="flex-1">
              <Text weight="bold" size={isCompactMobile ? 'lg' : 'xl'}>
                Personal AI workspace
              </Text>
              <Text className="text-on-surface-variant">
                Open a chat to jump back into Tone.
              </Text>
            </View>
            <Button label="New" icon={Plus} size="sm" onPress={handleNewChat} className="rounded-full" />
          </View>

          <View className="flex-row items-center rounded-2xl border border-outline-variant bg-surface-container px-3">
            <Search size={18} color={isLight ? '#1A1A1A' : '#FDFBD4'} />
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search chats"
              placeholderTextColor={isLight ? '#6B4A26' : '#FDFBD4'}
              className="ml-2 flex-1 py-3 text-on-surface"
            />
          </View>
        </View>

        <View className="flex-1">
          <ChatSidebar
            compact
            showHeader={false}
            searchText={searchText}
            onSearchTextChange={setSearchText}
            onNewChat={handleNewChat}
            chatsByGroup={chatsByGroup}
            selectedChatId={selectedChatId}
            onSelectChat={handleSelectChat}
            onRenameChat={handleRenameChat}
            onDeleteChat={handleDeleteChat}
          />

          {loading ? null : null}
        </View>
      </View>
    </ScreenContainer>
  );
}