import React, { useEffect, useState } from 'react';
import { View, Pressable, ScrollView, ActivityIndicator, Alert, Image } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Search, Filter, Heart, Copy, Bookmark, Sparkles, MoreVertical, Trash2, History, Settings, Share2 } from 'lucide-react-native';
import { deleteVaultRecord, fetchVaultRecords, VaultRecord } from '@/services/appData';
import { useAppStore } from '@/store/useAppStore';
import { useRouter } from 'expo-router';

type TabName = 'reply' | 'bio' | 'opener';

export default function VaultScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabName>('reply');
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<VaultRecord[]>([]);
  const removeFromVault = useAppStore((state) => state.removeFromVault);

  const loadVault = async () => {
    setLoading(true);
    try {
      const { data } = await fetchVaultRecords();
      setItems(data ?? []);
    } catch (e) {
      Alert.alert('Error', 'Failed to load vault items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVault();
  }, []);

  const filteredItems = items.filter((item) => item.type === activeTab);

  const handleCopy = async (content: string) => {
    await Clipboard.setStringAsync(content);
    Alert.alert('Copied', 'Vault item copied to clipboard.');
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Delete item?', 'This will remove the item from your vault.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await deleteVaultRecord(id);
          if (error) {
            Alert.alert('Delete failed', error.message || 'Could not delete item.');
            return;
          }
          removeFromVault(id);
          await loadVault();
        },
      },
    ]);
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="mt-8 mb-8">
          <Text variant="display" className="text-4xl">The Vault</Text>
          <Text className="text-on-surface-variant mt-2 text-lg font-inter">
            Your collection of elite responses and profile drafts.
          </Text>
        </View>

        <View className="flex-row gap-3 mb-8">
          {[
            { key: 'reply', label: 'Replies', icon: Heart },
            { key: 'bio', label: 'Bios', icon: Bookmark },
            { key: 'opener', label: 'Openers', icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <Pressable key={tab.key} onPress={() => setActiveTab(tab.key as TabName)} className="flex-1">
                <Card className={`p-4 rounded-2xl items-center border ${isActive ? 'bg-primary-container border-primary' : 'bg-surface-container border-outline-variant'}`}>
                  <Icon size={20} color={isActive ? '#3f008d' : '#ffb2b7'} />
                  <Text weight="bold" className={`mt-2 ${isActive ? 'text-on-primary-container' : 'text-on-surface'}`}>{tab.label}</Text>
                  <Text size="xs" className={isActive ? 'text-on-primary-container opacity-70' : 'text-outline'}>
                    {items.filter((item) => item.type === tab.key).length} items
                  </Text>
                </Card>
              </Pressable>
            );
          })}
        </View>

        {loading ? (
          <View className="py-20 items-center">
            <ActivityIndicator color="#d3bbff" size="large" />
          </View>
        ) : filteredItems.length === 0 ? (
          <Card className="p-10 bg-surface-container border border-outline-variant items-center rounded-3xl">
            <View className="w-16 h-16 rounded-full bg-surface-container-high items-center justify-center mb-6">
               <Bookmark size={32} color="#958da1" />
            </View>
            <Text weight="bold" size="xl" className="text-center">No saved {activeTab}s yet</Text>
            <Text className="text-outline text-center mt-2 leading-relaxed">
              Generate and save your first item from the reply, bio, or opener screens to see them here.
            </Text>
          </Card>
        ) : (
          <View className="gap-4">
            {filteredItems.map((item) => (
              <Card key={item.id} className="p-5 bg-surface-container border border-outline-variant rounded-2xl">
                <View className="flex-row justify-between items-center mb-4">
                  <View className={`px-2 py-1 rounded ${item.tone ? 'bg-secondary-container' : 'bg-surface-container-high'}`}>
                    <Text size="xs" weight="bold" className={item.tone ? 'text-on-secondary-container uppercase' : 'text-outline uppercase'}>
                      {item.tone || item.type}
                    </Text>
                  </View>
                  <Text className="text-outline text-[10px]">{item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</Text>
                </View>
                <Text size="md" className="text-on-surface leading-relaxed mb-6 font-inter">
                  {item.content}
                </Text>
                <View className="flex-row justify-between items-center pt-4 border-t border-outline-variant/30">
                  <View className="flex-row gap-6">
                    <Pressable onPress={() => handleCopy(item.content)}>
                      <Copy size={18} color="#e8e0ee" />
                    </Pressable>
                    <Pressable onPress={() => handleDelete(item.id)}>
                      <Trash2 size={18} color="#ffb2b7" />
                    </Pressable>
                  </View>
                  <Pressable onPress={() => handleCopy(item.content)}>
                    <Share2 size={18} color="#958da1" />
                  </Pressable>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
