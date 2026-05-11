import React, { useEffect, useState } from 'react';
import { View, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Search, Filter, Heart, Copy, Bookmark, Sparkles, MoreVertical, Trash2 } from 'lucide-react-native';
import { deleteVaultRecord, fetchVaultRecords, VaultRecord } from '@/services/appData';
import { useAppStore } from '@/store/useAppStore';

type TabName = 'reply' | 'bio' | 'opener';

export default function VaultScreen() {
  const [activeTab, setActiveTab] = useState<TabName>('reply');
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<VaultRecord[]>([]);
  const removeFromVault = useAppStore((state) => state.removeFromVault);

  const loadVault = async () => {
    setLoading(true);
    const { data } = await fetchVaultRecords();
    setItems(data ?? []);
    setLoading(false);
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
    <ScreenContainer>
      <View className="flex-row items-center justify-between py-4">
        <Text variant="headline" className="text-3xl">Vault</Text>
        <View className="flex-row items-center space-x-4">
          <Search size={24} color="#e8e0ee" />
          <Filter size={24} color="#e8e0ee" />
        </View>
      </View>

      <View className="mt-4 mb-8">
        <Text className="text-outline text-lg">Your collection of elite responses and profile drafts.</Text>
      </View>

      <View className="flex-row gap-3 mb-6">
        {[
          { key: 'reply', label: 'Replies', icon: Heart },
          { key: 'bio', label: 'Bios', icon: Bookmark },
          { key: 'opener', label: 'Openers', icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <Pressable key={tab.key} onPress={() => setActiveTab(tab.key as TabName)} className="flex-1">
              <Card className={`p-4 rounded-2xl items-center border ${isActive ? 'bg-primary-container border-primary' : 'bg-surface-container-high border-outline-variant'}`}>
                <Icon size={20} color={isActive ? '#3f008d' : '#ffb2b7'} />
                <Text weight="bold" className="mt-2">{tab.label}</Text>
                <Text size="xs" className="text-outline">{items.filter((item) => item.type === tab.key).length} items</Text>
              </Card>
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <ActivityIndicator color="#d3bbff" />
      ) : filteredItems.length === 0 ? (
        <Card className="p-8 bg-surface-container border border-outline-variant items-center">
          <Text weight="bold" size="xl">No saved {activeTab}s yet</Text>
          <Text className="text-outline text-center mt-2">Generate and save your first item from the reply, bio, or opener screens.</Text>
        </Card>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          <View className="gap-4">
            {filteredItems.map((item) => (
              <Card key={item.id} className="p-5 bg-surface-container border border-outline-variant">
                <View className="flex-row justify-between items-center mb-4">
                  <View className={`px-2 py-1 rounded ${item.tone ? 'bg-primary-container' : 'bg-secondary-container'}`}>
                    <Text size="xs" weight="bold" className={item.tone ? 'text-on-primary-container uppercase' : 'text-on-secondary-container uppercase'}>
                      {item.tone || item.type}
                    </Text>
                  </View>
                  <Text className="text-outline text-xs">{item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</Text>
                </View>
                <Text size="lg" className="text-on-surface-variant italic mb-6 leading-relaxed">
                  {item.content}
                </Text>
                <View className="flex-row justify-between items-center pt-4 border-t border-outline-variant/30">
                  <View className="flex-row space-x-6">
                    <Pressable onPress={() => handleCopy(item.content)}>
                      <Copy size={18} color="#958da1" />
                    </Pressable>
                    <Pressable onPress={() => handleDelete(item.id)}>
                      <Trash2 size={18} color="#ffb2b7" />
                    </Pressable>
                  </View>
                  <MoreVertical size={18} color="#4a4455" />
                </View>
              </Card>
            ))}
          </View>
        </ScrollView>
      )}
    </ScreenContainer>
  );
}
