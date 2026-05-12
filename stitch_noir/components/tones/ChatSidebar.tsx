import { Pressable, ScrollView, TextInput, View } from 'react-native';
import Animated, { FadeInDown, FadeInLeft } from 'react-native-reanimated';
import { Search, Plus, Pencil, Trash2 } from 'lucide-react-native';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
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
  return (
    <View className={`h-full ${compact ? 'w-full' : 'w-[340px]'} border-r border-outline-variant bg-surface-container/70 backdrop-blur-xl`}>
      {showHeader ? (
        <Animated.View entering={FadeInDown.springify().damping(18).stiffness(160)} className="border-b border-outline-variant p-4">
          <View className="mb-3 flex-row items-center justify-between">
            <View>
              <Text weight="bold" size="xl">
                Memory
              </Text>
              <Text className="text-on-surface-variant">
                Personal AI workspace
              </Text>
            </View>
            <Button label="New" icon={Plus} size="sm" onPress={onNewChat} className="rounded-full" />
          </View>

          <Animated.View entering={FadeInDown.delay(80).springify().damping(18).stiffness(160)} className="flex-row items-center rounded-2xl border border-outline-variant bg-background px-3">
            <Search size={18} color="#958da1" />
            <TextInput
              value={searchText}
              onChangeText={onSearchTextChange}
              placeholder="Search chats"
              placeholderTextColor="#958da1"
              className="ml-2 flex-1 py-3 text-on-surface"
            />
          </Animated.View>
        </Animated.View>
      ) : null}

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <View className="mb-6">
          <Text variant="label" className="mb-3 text-on-surface-variant">
            Conversations
          </Text>
          <View className="gap-2">
            {chatsByGroup.map((group, groupIndex) => (
              <Animated.View
                key={group.label}
                entering={FadeInDown.delay(120 + groupIndex * 90).springify().damping(18).stiffness(160)}
                className="mb-4"
              >
                <Text size="xs" className="mb-2 text-on-surface-variant uppercase tracking-widest">
                  {group.label}
                </Text>
                <View className="gap-2">
                  {group.items.map((chat, chatIndex) => {
                    const isSelected = chat.id === selectedChatId;

                    return (
                      <Animated.View
                        key={chat.id}
                        entering={FadeInLeft.delay(150 + groupIndex * 90 + chatIndex * 35).springify().damping(18).stiffness(170)}
                      >
                        <Pressable
                          onPress={() => onSelectChat(chat.id)}
                          onLongPress={() => onRenameChat(chat)}
                          className={`rounded-2xl border px-3 py-3 ${
                            isSelected ? 'border-primary bg-primary/15' : 'border-outline-variant bg-background'
                          }`}
                        >
                          <View className="flex-row items-start justify-between gap-3">
                            <View className="flex-1">
                              <Text weight="semibold" numberOfLines={1}>
                                {chat.title}
                              </Text>
                            </View>
                            <View className="flex-row items-center gap-2">
                              <Pressable onPress={() => onRenameChat(chat)} className="rounded-full p-1.5 active:bg-white/10">
                                <Pencil size={14} color="#cbbddc" />
                              </Pressable>
                              <Pressable onPress={() => onDeleteChat(chat)} className="rounded-full p-1.5 active:bg-white/10">
                                <Trash2 size={14} color="#ff9da8" />
                              </Pressable>
                            </View>
                          </View>
                        </Pressable>
                      </Animated.View>
                    );
                  })}
                </View>
              </Animated.View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
