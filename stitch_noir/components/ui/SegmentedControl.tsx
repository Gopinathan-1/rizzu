import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/Text';
// NativeWind 4.x uses the babel plugin to enhance components.

interface SegmentedControlProps {
  options: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
}

export const SegmentedControl = ({ options, selectedIndex, onChange }: SegmentedControlProps) => {
  return (
    <View className="flex-row bg-surface-container-low p-1 rounded-lg border border-outline-variant">
      {options.map((option, index) => (
        <Pressable
          key={option}
          onPress={() => onChange(index)}
          className={`flex-1 py-2 rounded-md items-center justify-center ${
            selectedIndex === index ? 'bg-surface-container-high' : ''
          }`}
        >
          <Text 
            weight={selectedIndex === index ? 'bold' : 'regular'}
            className={selectedIndex === index ? 'text-on-surface' : 'text-outline'}
          >
            {option}
          </Text>
        </Pressable>
      ))}
    </View>
  );
};
