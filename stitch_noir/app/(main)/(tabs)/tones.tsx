import React from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { Sparkles, Zap, Ghost, Heart, Shield, Search } from 'lucide-react-native';

export default function TonesScreen() {
  const tones = [
    {
      name: 'Witty',
      description: 'Clever, fast-paced, and intellectually sharp. Best for high-energy banter.',
      icon: Sparkles,
      color: '#d3bbff'
    },
    {
      name: 'Mysterious',
      description: 'Calculated, reserved, and intriguing. Creates a sense of depth and curiosity.',
      icon: Ghost,
      color: '#adc6ff'
    },
    {
      name: 'Savage',
      description: 'Bold, unapologetic, and high-dominance. For when you want to take control.',
      icon: Zap,
      color: '#ffb2b7'
    },
    {
      name: 'Professional',
      description: 'Polished, respectful, and clear. Ideal for networking or formal contexts.',
      icon: Shield,
      color: '#e8e0ee'
    },
    {
      name: 'Flirty',
      description: 'Warm, suggestive, and charming. Designed to build romantic tension.',
      icon: Heart,
      color: '#ffdad6'
    }
  ];

  return (
    <ScreenContainer>
      <View className="flex-row items-center justify-between py-4">
        <Text variant="headline" className="text-3xl">Tones</Text>
        <Search size={24} color="#e8e0ee" />
      </View>

      <View className="mt-4 mb-8">
        <Text className="text-outline text-lg">Select the AI personality that fits your current situation.</Text>
      </View>

      <View className="space-y-4">
        {tones.map((tone) => (
          <Card key={tone.name} className="p-6 bg-surface-container border border-outline-variant flex-row items-center">
            <View 
              className="w-14 h-14 rounded-2xl items-center justify-center mr-5"
              style={{ backgroundColor: `${tone.color}20` }}
            >
              <tone.icon size={28} color={tone.color} />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center justify-between mb-1">
                <Text weight="bold" size="xl">{tone.name}</Text>
                {tone.name === 'Witty' && (
                   <View className="bg-primary px-2 py-0.5 rounded">
                     <Text size="xs" weight="bold" className="text-on-primary">ACTIVE</Text>
                   </View>
                )}
              </View>
              <Text className="text-outline text-sm leading-relaxed">{tone.description}</Text>
            </View>
          </Card>
        ))}
      </View>

      <View className="mt-12 bg-surface-container-highest p-8 rounded-[32px] items-center">
        <Sparkles size={40} color="#d3bbff" />
        <Text weight="bold" size="xl" className="mt-4 text-center">Custom Tone Engine</Text>
        <Text className="text-outline text-center mt-2 leading-relaxed">
          Upload your own chat history to train Aura on your specific speaking style.
        </Text>
        <Button 
          label="Try Beta" 
          variant="secondary" 
          size="sm" 
          className="mt-6 px-10 rounded-xl"
        />
      </View>
    </ScreenContainer>
  );
}
