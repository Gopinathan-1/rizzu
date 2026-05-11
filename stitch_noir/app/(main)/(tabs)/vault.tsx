import React from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { 
  Search, 
  Filter, 
  Heart, 
  Copy, 
  Share2, 
  Bookmark,
  Sparkles,
  MoreVertical
} from 'lucide-react-native';

export default function VaultScreen() {
  const savedReplies = [
    {
      tone: 'Witty',
      text: "I usually don't send the first message, but your choice in architecture is too good to ignore....",
      date: '2m ago'
    },
    {
      tone: 'Savage',
      text: "Calculated risk is my specialty. You should know by now I never make a move without an endgame.",
      date: '1h ago'
    },
    {
      tone: 'Flirty',
      text: "Is it just me or do we have better chemistry than a high school science lab? 🧪",
      date: 'Yesterday'
    }
  ];

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

      <View className="flex-row space-x-3 mb-8">
        <View className="flex-1 bg-surface-container-high p-4 rounded-2xl items-center border border-outline-variant">
          <Heart size={20} color="#ffb2b7" />
          <Text weight="bold" className="mt-2">Favorites</Text>
          <Text size="xs" className="text-outline">12 items</Text>
        </View>
        <View className="flex-1 bg-surface-container-high p-4 rounded-2xl items-center border border-outline-variant">
          <Bookmark size={20} color="#d3bbff" />
          <Text weight="bold" className="mt-2">Replies</Text>
          <Text size="xs" className="text-outline">48 items</Text>
        </View>
        <View className="flex-1 bg-surface-container-high p-4 rounded-2xl items-center border border-outline-variant">
          <Sparkles size={20} color="#adc6ff" />
          <Text weight="bold" className="mt-2">Bios</Text>
          <Text size="xs" className="text-outline">5 items</Text>
        </View>
      </View>

      <View className="space-y-4">
        {savedReplies.map((item, index) => (
          <Card key={index} className="p-5 bg-surface-container border border-outline-variant">
            <View className="flex-row justify-between items-center mb-4">
              <View className={`px-2 py-1 rounded bg-opacity-20 ${
                item.tone === 'Witty' ? 'bg-primary-container' : 
                item.tone === 'Savage' ? 'bg-tertiary-container' : 'bg-secondary-container'
              }`}>
                <Text size="xs" weight="bold" className="tracking-widest uppercase">{item.tone}</Text>
              </View>
              <Text className="text-outline text-xs">{item.date}</Text>
            </View>
            <Text size="lg" className="text-on-surface-variant italic mb-6 leading-relaxed">
              "{item.text}"
            </Text>
            <View className="flex-row justify-between items-center pt-4 border-t border-outline-variant/30">
               <View className="flex-row space-x-6">
                 <Copy size={18} color="#958da1" />
                 <Share2 size={18} color="#958da1" />
                 <Heart size={18} color="#ffb2b7" fill="#ffb2b7" />
               </View>
               <MoreVertical size={18} color="#4a4455" />
            </View>
          </Card>
        ))}
      </View>
    </ScreenContainer>
  );
}
