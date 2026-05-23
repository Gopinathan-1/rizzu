import { Pressable, ScrollView, TextInput, View } from 'react-native';
import Animated, { FadeInDown, FadeInLeft } from 'react-native-reanimated';
import { Search, Plus, Pencil, Trash2, Sparkles } from 'lucide-react-native';
import { useAppStore } from '@/store/useAppStore';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import type { WorkspaceChat } from '@/services/chatWorkspace';

export type ChatSidebarProps = {
  searchText: string;
  onSearchTextChange: (value: string) => void;
  onNewChat: () => void;
  chatsByGroup: Array<{ label: string; items: WorkspaceChat[] }>;
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onRenameChat: (chat: WorkspaceChat) => void;
  onDeleteChat: (chat: WorkspaceChat) => void;
  compact?: boolean;
  showHeader?: boolean;
};

export function ChatSidebar({
  searchText,
  onSearchTextChange,
  onNewChat,
  chatsByGroup,
  selectedChatId,
  onSelectChat,
  onRenameChat,
  onDeleteChat,
  compact = false,
  showHeader = true,
}: ChatSidebarProps) {
  const hasChats = chatsByGroup.some((group) => group.items.length > 0);
  const themeMode = useAppStore((state) => state.themeMode);
  const isLight = themeMode === 'light';

  return (
    <View className={`h-full ${compact ? 'w-full' : 'w-[340px]'} border-r border-border bg-bg-surface/70 backdrop-blur-xl`}>
      {showHeader ? (
        <Animated.View entering={FadeInDown.springify().damping(18).stiffness(160)} className="border-b border-border p-4">
          <View className="mb-3 flex-row items-center justify-between">
            <View>
              <Text weight="bold" size="xl">
                Memory
              </Text>
              <Text className="text-text-secondary">
                Personal AI workspace
              </Text>
            </View>
            <Button label="New" size="sm" onPress={onNewChat} className="rounded-full" />
          </View>

          <Animated.View entering={FadeInDown.delay(80).springify().damping(18).stiffness(160)} className="flex-row items-center rounded-2xl border border-border bg-bg-elevated px-3">
            <Search size={18} color={isLight ? '#000000' : '#FFFFFF'} />
            <TextInput
              value={searchText}
              onChangeText={onSearchTextChange}
              placeholder="Search chats"
              placeholderTextColor={isLight ? '#000000' : '#FFFFFF'}
              className="ml-2 flex-1 py-3 text-text-primary"
            />
          </Animated.View>
        </Animated.View>
      ) : null}

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {!hasChats ? (
          <EmptyState
            title={searchText ? 'No chats found' : 'No conversations yet'}
            message={searchText ? 'Try a different search, or start a new chat to build your workspace.' : 'Start a chat and Stitch Noir will keep the thread, tone, and history organized for you.'}
            icon={Sparkles}
            action={<Button label="New chat" icon={Plus} size="sm" onPress={onNewChat} className="rounded-full" />}
          />
        ) : (
          <View className="mb-6">
          <Text variant="label" className="mb-3 text-text-secondary">
            Conversations
          </Text>
          <View className="gap-2">
            {chatsByGroup.map((group, groupIndex) => (
              <Animated.View
                key={group.label}
                entering={FadeInDown.delay(120 + groupIndex * 90).springify().damping(18).stiffness(160)}
                className="mb-4"
              >
                <Text size="xs" className="mb-2 text-text-secondary uppercase tracking-widest">
                  {group.label}
                </Text>
                <View className="gap-2">
                  {group.items.map((chat, chatIndex) => {
                    const isSelected = chat.id === selectedChatId;

                    return (
                      <Animated.View
                        key={chat.id}
                        entering={FadeInLeft.delay(150 + groupIndex * 90 + chatIndex * 35).springify().damping(18).stiffness(170)}
                        className={`rounded-2xl border px-3 py-3 ${isSelected ? 'border-accent bg-accent/10' : 'border-border bg-bg-elevated'}`}
                      >
                        <View className="flex-row items-start justify-between gap-3">
                          <Pressable onPress={() => onSelectChat(chat.id)} className="flex-1 pr-3">
                            <Text weight="semibold" numberOfLines={1}>
                              {chat.title}
                            </Text>
                          </Pressable>
                          <View className="flex-row items-center gap-2">
                            <Pressable
                              onPress={(event) => {
                                event.stopPropagation?.();
                                onRenameChat(chat);
                              }}
                              className="rounded-full p-1.5 active:bg-white/10"
                              hitSlop={8}
                            >
                              <Pencil size={14} color={isLight ? '#000000' : '#FFFFFF'} />
                            </Pressable>
                            <Pressable
                              onPress={(event) => {
                                event.stopPropagation?.();
                                onDeleteChat(chat);
                              }}
                              className="rounded-full p-1.5 active:bg-white/10"
                              hitSlop={8}
                            >
                              <Trash2 size={14} color={isLight ? '#C94040' : '#E05555'} />
                            </Pressable>
                          </View>
                        </View>
                      </Animated.View>
                    );
                  })}
                </View>
              </Animated.View>
            ))}
          </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
