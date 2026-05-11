import React from 'react';
import { View, ScrollView, Pressable, Image } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { 
  History, 
  Settings, 
  Clipboard, 
  Camera, 
  ChevronRight, 
  Zap, 
  UserCircle, 
  BarChart3,
  MessageSquarePlus,
  Sparkles
} from 'lucide-react-native';
import { Link } from 'expo-router';

export default function HomeScreen() {
  const tones = ['Witty', 'Mysterious', 'Professional', 'Playful', 'Stoic'];

  return (
    <ScreenContainer className="bg-background">
      {/* TopAppBar */}
      <View className="flex-row items-center justify-between py-4 h-16">
        <Text variant="headline" className="text-2xl tracking-tighter">Aura AI</Text>
        <View className="flex-row items-center gap-4">
          <Pressable className="p-2 rounded-lg active:bg-surface-high">
            <History size={22} color="#f5f5f5" />
          </Pressable>
          <Link href="/settings" asChild>
            <Pressable className="p-2 rounded-lg active:bg-surface-high">
              <Settings size={22} color="#f5f5f5" />
            </Pressable>
          </Link>
          <View className="w-8 h-8 rounded-full border border-outline-variant overflow-hidden">
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=100&auto=format&fit=crop' }}
              className="w-full h-full"
            />
          </View>
        </View>
      </View>

      {/* Hero Section */}
      <View className="mt-8 mb-8">
        <Text variant="display" className="text-5xl">Your AI{"\n"}Wingman.</Text>
        <Text className="text-on-surface-variant mt-2 text-lg font-inter">
          Elevate every message with Aura's elite social intelligence.
        </Text>
      </View>

      {/* Primary Actions Grid */}
      <View className="gap-4">
        <Card className="flex-row items-center p-6 bg-surface-container border border-outline-variant rounded-xl active:bg-surface-high">
          <View className="mr-4">
            <Clipboard size={32} color="#d3bbff" />
          </View>
          <View className="flex-1">
            <Text weight="bold" size="md">Paste Conversation</Text>
            <Text variant="label" className="text-on-surface-variant lowercase tracking-normal font-inter opacity-70">Text-based analysis</Text>
          </View>
          <ChevronRight size={20} color="#958da1" />
        </Card>

        <Card className="flex-row items-center p-6 bg-surface-container border border-outline-variant rounded-xl active:bg-surface-high">
          <View className="mr-4">
            <Camera size={32} color="#d3bbff" />
          </View>
          <View className="flex-1">
            <Text weight="bold" size="md">Upload Screenshot</Text>
            <Text variant="label" className="text-on-surface-variant lowercase tracking-normal font-inter opacity-70">Visual OCR analysis</Text>
          </View>
          <ChevronRight size={20} color="#958da1" />
        </Card>
      </View>

      {/* Trending Tones */}
      <View className="mt-10">
        <View className="flex-row items-center justify-between mb-4">
          <Text variant="label" className="text-on-surface-variant">Trending Tones</Text>
          <Text className="text-primary text-xs font-bold">View all</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5 px-5">
          <View className="flex-row gap-2">
            {tones.map((tone, i) => (
              <View 
                key={tone} 
                className={`px-5 py-2.5 rounded-full border ${i === 0 ? 'bg-primary-container border-primary-container' : 'bg-surface-container border-outline-variant'}`}
              >
                <Text weight="bold" size="sm" className={i === 0 ? 'text-on-primary-container' : 'text-on-surface'}>{tone}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Quick Actions Bento Grid */}
      <View className="mt-12">
        <Text variant="label" className="text-on-surface-variant mb-4">Quick Actions</Text>
        <View className="gap-4">
          <Card className="p-6 bg-surface-container border border-outline-variant min-h-[160px] justify-between rounded-xl">
            <Zap size={24} color="#d3bbff" />
            <View>
              <Text variant="headline" size="xl" className="mb-1">Generate Opener</Text>
              <Text className="text-on-surface-variant text-sm">Break the ice instantly with AI logic.</Text>
            </View>
          </Card>
          
          <View className="flex-row gap-4">
            <Card className="flex-1 p-6 bg-surface-container border border-outline-variant aspect-square justify-between rounded-xl">
              <Sparkles size={24} color="#adc6ff" />
              <View>
                <Text weight="bold" size="md" className="mb-1">Write Bio</Text>
                <Text className="text-on-surface-variant text-xs">Profile optimization.</Text>
              </View>
            </Card>
            <Card className="flex-1 p-6 bg-surface-container border border-outline-variant aspect-square justify-between rounded-xl">
              <BarChart3 size={24} color="#ffb2b7" />
              <View>
                <Text weight="bold" size="md" className="mb-1">Analysis</Text>
                <Text className="text-on-surface-variant text-xs">Sentiment score.</Text>
              </View>
            </Card>
          </View>
        </View>
      </View>

      {/* Recent Generations */}
      <View className="mt-12 mb-20">
        <View className="flex-row items-center justify-between mb-4">
          <Text variant="label" className="text-on-surface-variant">Recent Generations</Text>
          <ChevronRight size={20} color="#958da1" />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5 px-5">
          <View className="flex-row gap-4">
            <Card className="w-[280px] p-5 bg-surface-low border border-outline-variant rounded-xl">
              <View className="flex-row items-center justify-between mb-4">
                <View className="bg-secondary-container px-2 py-0.5 rounded">
                  <Text weight="bold" className="text-[10px] text-on-secondary-container uppercase">Witty</Text>
                </View>
                <Text className="text-on-surface-variant text-[10px]">2m ago</Text>
              </View>
              <Text className="italic text-on-surface leading-relaxed text-sm">
                "I usually don't send the first message, but your choice in architecture is too good to ignore. Frank Lloyd Wright enthusiast?"
              </Text>
            </Card>
            
            <Card className="w-[280px] p-5 bg-surface-low border border-outline-variant rounded-xl">
              <View className="flex-row items-center justify-between mb-4">
                <View className="bg-tertiary-container px-2 py-0.5 rounded">
                  <Text weight="bold" className="text-[10px] text-on-tertiary-container uppercase">Mysterious</Text>
                </View>
                <Text className="text-on-surface-variant text-[10px]">15m ago</Text>
              </View>
              <Text className="italic text-on-surface leading-relaxed text-sm">
                "The third photo is giving me intense 'I have a secret hideout in the Alps' energy. Close?"
              </Text>
            </Card>
          </View>
        </ScrollView>
      </View>

      {/* FAB */}
      <View className="absolute bottom-10 right-6">
        <Pressable className="w-16 h-16 rounded-full bg-primary items-center justify-center shadow-2xl active:scale-90 transition-transform">
          <MessageSquarePlus size={28} color="#3f008d" />
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
