import React, { useState } from 'react';
import { View, TextInput, ScrollView, Pressable, Image } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Button } from '@/components/ui/Button';
import { 
  History, 
  Settings, 
  Coffee, 
  Plane, 
  Sparkles, 
  Zap,
  UserCircle,
  Copy, 
  RotateCcw,
  MoreHorizontal
} from 'lucide-react-native';

export default function BiosScreen() {
  const [mode, setMode] = useState(0); // 0: Bio Writer, 1: Opener Generator
  const [input, setInput] = useState("Avid traveler, espresso enthusiast, and amateur chess player. Looking for someone to beat me at Queen's Gambit.");

  return (
    <ScreenContainer>
       {/* Header */}
       <View className="flex-row items-center justify-between py-4">
        <Text variant="headline" className="text-3xl">Aura AI</Text>
        <View className="flex-row items-center space-x-4">
          <History size={24} color="#e8e0ee" />
          <Settings size={24} color="#e8e0ee" />
        </View>
      </View>

      <View className="mt-4 mb-6">
        <Text variant="display" size="3xl">Identity Lab</Text>
        <Text className="text-outline mt-1">Engineer your digital persona with surgical precision.</Text>
      </View>

      <SegmentedControl 
        options={['Bio Writer', 'Opener Generator']} 
        selectedIndex={mode} 
        onChange={setMode} 
      />

      {/* Input Section */}
      <View className="mt-8">
        <View className="flex-row justify-between mb-2">
          <Text variant="label">Input Source</Text>
          <Text className="text-primary text-xs font-bold">42/500</Text>
        </View>
        <Card className="bg-surface-container-lowest border border-outline-variant p-4 h-40">
          <TextInput
            multiline
            value={input}
            onChangeText={setInput}
            className="text-on-surface font-inter text-base"
            placeholderTextColor="#958da1"
            placeholder="Describe yourself or your vibe..."
          />
        </Card>
        <View className="flex-row mt-3 space-x-2">
          <View className="flex-row items-center bg-surface-container-high px-3 py-1.5 rounded-full border border-outline-variant">
            <Coffee size={14} color="#e8e0ee" className="mr-2" />
            <Text size="sm">Espresso</Text>
          </View>
          <View className="flex-row items-center bg-surface-container-high px-3 py-1.5 rounded-full border border-outline-variant">
            <Plane size={14} color="#e8e0ee" className="mr-2" />
            <Text size="sm">Travel</Text>
          </View>
        </View>
      </View>

      {/* Platform DNA */}
      <View className="mt-8">
        <Text variant="label" className="mb-4">Platform DNA</Text>
        <View className="flex-row space-x-3">
          <View className="flex-1 items-center p-4 rounded-xl border-2 border-primary-container bg-surface-container-low">
             <View className="w-10 h-10 rounded-full bg-slate-800 mb-2 overflow-hidden items-center justify-center">
                {/* Tinder Logo Mock */}
                <Text weight="bold" size="xs">T</Text>
             </View>
             <Text weight="bold" size="sm">Tinder</Text>
          </View>
          <View className="flex-1 items-center p-4 rounded-xl border border-outline-variant bg-surface-container-lowest opacity-60">
             <View className="w-10 h-10 rounded-full bg-slate-800 mb-2 overflow-hidden items-center justify-center">
                <Text weight="bold" size="xs">H</Text>
             </View>
             <Text weight="bold" size="sm">Hinge</Text>
          </View>
          <View className="flex-1 items-center p-4 rounded-xl border border-outline-variant bg-surface-container-lowest opacity-60">
             <View className="w-10 h-10 rounded-full bg-slate-800 mb-2 overflow-hidden items-center justify-center">
                <Text weight="bold" size="xs">B</Text>
             </View>
             <Text weight="bold" size="sm">Bumble</Text>
          </View>
        </View>
      </View>

      {/* Generate Button */}
      <Button 
        label="Generate Drafts" 
        icon={Sparkles} 
        className="mt-8 bg-primary/30 py-5" 
        variant="primary"
      />

      {/* Results */}
      <View className="mt-10">
        <Card className="border-2 border-primary-container p-6 mb-4 relative">
          <View className="absolute top-0 right-0 bg-secondary-container px-3 py-1 rounded-bl-lg flex-row items-center">
            <Zap size={12} color="#e6ecff" className="mr-1" />
            <Text size="xs" weight="bold" className="text-on-secondary-container">VIRAL PICK</Text>
          </View>
          
          <View className="flex-row items-center mb-4">
             <View className="w-10 h-10 rounded-full bg-surface-container-highest items-center justify-center mr-3">
               <Sparkles size={20} color="#d3bbff" />
             </View>
             <View>
               <Text weight="bold">The Strategic Tease</Text>
               <View className="flex-row items-center">
                  <View className="w-2 h-2 rounded-full bg-tertiary mr-1" />
                  <Text size="xs" className="text-tertiary font-bold">98% AI Confidence</Text>
               </View>
             </View>
          </View>

          <Text size="lg" className="leading-relaxed mb-6">
            "My espresso order is more complex than my life choices. Searching for a travel partner who isn't afraid of a 4 AM airport run or a chess rematch they'll definitely lose. ♟️✈️"
          </Text>

          <View className="flex-row items-center justify-between pt-4 border-t border-outline-variant/30">
            <View className="flex-row space-x-4">
              <View className="flex-row items-center">
                <Copy size={16} color="#e8e0ee" className="mr-2" />
                <Text size="sm">Copy</Text>
              </View>
              <View className="flex-row items-center">
                <RotateCcw size={16} color="#e8e0ee" className="mr-2" />
                <Text size="sm">Variations</Text>
              </View>
            </View>
            <Text className="text-outline text-xs">158 characters</Text>
          </View>
        </Card>

        {/* Other Results */}
        <Card className="p-5 mb-4 bg-surface-container-low border border-outline-variant">
           <View className="flex-row justify-between mb-3">
              <Text variant="label">Short & Sweet</Text>
              <MoreHorizontal size={20} color="#958da1" />
           </View>
           <Text className="text-on-surface-variant mb-4">
             "Espresso & Chess. Send your best opening move. ♟️☕"
           </Text>
           <View className="flex-row justify-between items-center">
              <Text size="xs" className="text-outline font-bold">84% Match</Text>
              <Copy size={16} color="#958da1" />
           </View>
        </Card>

        <Card className="p-5 mb-8 bg-surface-container-low border border-outline-variant">
           <View className="flex-row justify-between mb-3">
              <Text variant="label">The Adventurer</Text>
              <MoreHorizontal size={20} color="#958da1" />
           </View>
           <Text className="text-on-surface-variant mb-4">
             "World traveler looking for a co-pilot who handles jet lag as well as I handle a double shot of espresso."
           </Text>
           <View className="flex-row justify-between items-center">
              <Text size="xs" className="text-outline font-bold">91% Match</Text>
              <Copy size={16} color="#958da1" />
           </View>
        </Card>

        {/* Pro Tip */}
        <Card className="bg-surface-container-highest p-6 flex-row items-center mb-10">
          <View className="w-20 h-20 rounded-lg bg-surface-container-low mr-4 overflow-hidden items-center justify-center">
             <UserCircle size={60} color="#3c3742" />
          </View>
          <View className="flex-1">
            <Text weight="bold">Pro Tip: Contrast Matters</Text>
            <Text size="sm" className="text-outline mt-1 leading-relaxed">
              Your bio works best with high-resolution, low-saturation photos. Pair these drafts with your 'Quiet Luxury' photo set.
            </Text>
          </View>
        </Card>
      </View>
    </ScreenContainer>
  );
}
