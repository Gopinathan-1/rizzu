import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { Search, Plus, Pencil, Trash2 } from 'lucide-react-native';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import type { WorkspaceChat, WorkspaceUpload } from '@/services/chatWorkspace';

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
}: ChatSidebarProps) {
  return (
    <View className={`h-full ${compact ? 'w-full' : 'w-[340px]'} border-r border-outline-variant bg-surface-container/70 backdrop-blur-xl`}>
      <View className="border-b border-outline-variant p-4">
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

        <View className="flex-row items-center rounded-2xl border border-outline-variant bg-background px-3">
          <Search size={18} color="#958da1" />
          <TextInput
            value={searchText}
            onChangeText={onSearchTextChange}
            placeholder="Search chats"
            placeholderTextColor="#958da1"
            className="ml-2 flex-1 py-3 text-on-surface"
          />
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <View className="mb-6">
          <Text variant="label" className="mb-3 text-on-surface-variant">
            Conversations
          </Text>
          <View className="gap-2">
            {chatsByGroup.map((group) => (
              <View key={group.label} className="mb-4">
                <Text size="xs" className="mb-2 text-on-surface-variant uppercase tracking-widest">
                  {group.label}
                </Text>
                <View className="gap-2">
                  {group.items.map((chat) => {
                    const isSelected = chat.id === selectedChatId;

                    return (
                      <Pressable
                        key={chat.id}
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
                            <Text size="xs" className="mt-1 text-on-surface-variant" numberOfLines={1}>
                              {new Date(chat.updated_at).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                              })}
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
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
