import React, { useState } from 'react';
import { View, Pressable, ScrollView, Image } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { 
  History, 
  Settings, 
  Heart, 
  Share2, 
  RotateCcw
} from 'lucide-react-native';

export default function ReplyGeneratorScreen() {
  const [selectedTone, setSelectedTone] = useState('Savage');
  const tones = ['Savage', 'Flirty', 'Professional'];

  return (
    <ScreenContainer className="bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between py-4 h-16">
        <Text variant="headline" className="text-2xl tracking-tighter">Aura AI</Text>
        <View className="flex-row items-center gap-4">
          <Pressable className="p-2 rounded-lg active:bg-surface-high">
            <History size={22} color="#f5f5f5" />
          </Pressable>
          <Pressable className="p-2 rounded-lg active:bg-surface-high">
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

      {/* Incoming Context */}
      <View className="mt-8">
        <View className="flex-row items-center gap-3 mb-4">
          <Text variant="label" className="text-on-surface-variant">Incoming Context</Text>
          <View className="flex-1 h-[1px] bg-outline-variant" />
        </View>
        
        <Card className="bg-surface-low border border-outline-variant p-6 rounded-xl">
          <View className="flex-row items-center mb-4">
             <View className="w-12 h-12 rounded-xl bg-surface-high mr-4 overflow-hidden border border-outline-variant">
               <Image 
                 source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop' }} 
                 className="w-full h-full"
               />
             </View>
             <View>
                <Text weight="bold" size="lg">Elena V.</Text>
             </View>
          </View>
          <Text size="lg" className="text-on-surface italic leading-relaxed">
            "Honestly, I wasn't expecting you to actually follow through with that idea. It's... bold. What's your move now?"
          </Text>
        </Card>
      </View>

      {/* Suggested Replies */}
      <View className="mt-10 flex-1">
        <View className="flex-row items-center justify-between mb-4">
          <Text variant="label" className="text-on-surface-variant">Suggested Replies</Text>
          <View className="flex-row items-center gap-2">
             <View className="w-2 h-2 rounded-full bg-primary" />
             <Text size="xs" className="text-primary font-bold">Aura is thinking...</Text>
          </View>
        </View>

        <Card className="flex-1 bg-surface-container border border-outline-variant p-8 justify-center rounded-2xl relative">
          <View className="absolute top-6 left-6 bg-surface-highest px-2 py-0.5 rounded">
             <Text weight="bold" className="text-[10px] text-on-surface-variant uppercase">RESPONSE 1 OF 3</Text>
          </View>
          <View className="absolute top-6 right-6 flex-row gap-4">
             <Pressable>
               <Heart size={22} color="#f5f5f5" />
             </Pressable>
             <Pressable>
               <Share2 size={22} color="#f5f5f5" />
             </Pressable>
          </View>

          <Text variant="display" className="text-center text-4xl leading-tight">
            Calculated risk is my specialty. You should know by now I never make a move without an endgame.
          </Text>
        </Card>
      </View>

      {/* Tone Selection */}
      <View className="mt-8 mb-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5 px-5">
           <View className="flex-row gap-2">
            {tones.map((tone) => (
              <Pressable 
                key={tone}
                onPress={() => setSelectedTone(tone)}
                className={`px-8 py-3.5 rounded-full border ${
                  selectedTone === tone 
                    ? 'bg-primary-container border-primary' 
                    : 'bg-surface-low border-outline-variant'
                }`}
              >
                <Text weight="bold" size="sm" className={selectedTone === tone ? 'text-on-primary-container' : 'text-on-surface'}>
                  {tone}
                </Text>
              </Pressable>
            ))}
           </View>
        </ScrollView>
      </View>

      {/* Generate Button */}
      <View className="mt-4 mb-8">
        <Pressable 
          className="bg-primary-container h-16 rounded-full flex-row items-center justify-center active:brightness-110"
        >
          <RotateCcw size={20} color="#dac5ff" className="mr-2" />
          <Text weight="bold" size="lg" className="text-on-primary-container">Regenerate Vibes</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
