import React from 'react';
import { View, Pressable, ScrollView, Dimensions } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { useRouter } from 'expo-router';
import {
  X,
  Zap,
  Sparkles,
  MessageSquare,
  Camera,
  ShieldCheck,
} from 'lucide-react-native';
import { useAppStore } from '@/store/useAppStore';

const { height } = Dimensions.get('window');

export default function PaywallScreen() {
  const router = useRouter();
  const themeMode = useAppStore((state) => state.themeMode);
  const isLight = themeMode === 'light';

  const Feature = ({ icon: Icon, title, description }: any) => (
    <View className="flex-row items-center mb-6">
      <View className="w-12 h-12 rounded-2xl bg-bg-elevated items-center justify-center mr-4 border border-border">
        <Icon size={24} color={isLight ? '#1A1A1A' : '#FDFBD4'} />
      </View>
      <View className="flex-1">
        <Text weight="bold" size="lg">{title}</Text>
        <Text className="text-text-secondary text-sm">{description}</Text>
      </View>
    </View>
  );

  return (
    <ScreenContainer scrollable={false} className="px-0">
      <View className="flex-1 bg-bg-primary">
        {/* Header Image/Gradient */}
        <View className="h-[35%] bg-bg-surface items-center justify-center relative border-b border-border">
          <Pressable
            onPress={() => router.back()}
            className="absolute top-12 left-6 w-10 h-10 rounded-full bg-bg-elevated items-center justify-center border border-border"
          >
            <X size={24} color={isLight ? '#1A1A1A' : '#FDFBD4'} />
          </Pressable>

          <Zap size={80} color={isLight ? '#1A1A1A' : '#FDFBD4'} />
          <Text variant="display" className="mt-4 text-center">Go Elite.</Text>
        </View>

        <ScrollView className="flex-1 px-6 -mt-10 bg-bg-primary rounded-t-[40px] pt-10">
          <Text variant="label" className="mb-8">UNLIMITED ACCESS</Text>

          <Feature
            icon={Sparkles}
            title="GPT-5 Reasoning"
            description="Access the world's most advanced conversational AI for flawless replies."
          />
          <Feature
            icon={Camera}
            title="Unlimited Screenshot OCR"
            description="Analyze as many conversation screenshots as you want."
          />
          <Feature
            icon={ShieldCheck}
            title="Stealth Mode"
            description="Remove all watermarks and AI signatures from generated text."
          />
          <Feature
            icon={MessageSquare}
            title="Priority Support"
            description="Direct access to our human social engineers for complex cases."
          />

          <View className="mt-4 space-y-4">
            <Card className="p-6 border-2 border-border bg-surface relative">
              <View className="absolute -top-3 right-6 bg-accent px-3 py-1 rounded-full">
                <Text size="xs" weight="bold" className="text-background">BEST VALUE</Text>
              </View>
              <View className="flex-row justify-between items-center">
                <View>
                  <Text weight="bold" size="xl">Yearly Elite</Text>
                  <Text className="text-text-secondary text-xs mt-1">$9.99 / month, billed annually</Text>
                </View>
                <Text weight="bold" size="2xl">$119.99</Text>
              </View>
            </Card>

            <Card className="p-6 border border-border bg-surface">
              <View className="flex-row justify-between items-center">
                <View>
                  <Text weight="bold" size="xl">Monthly Elite</Text>
                  <Text className="text-text-secondary text-xs mt-1">Flexible, cancel anytime</Text>
                </View>
                <Text weight="bold" size="2xl">$19.99</Text>
              </View>
            </Card>
          </View>

          <View className="mt-10 pb-10">
            <Button label="Unlock Elite Access" className="py-5 rounded-2xl mb-4" />
            <Text className="text-center text-outline text-[10px] leading-relaxed">
              Subscription will automatically renew. Cancel anytime in App Store settings. By continuing, you agree to our Terms of Service and Privacy Policy.
            </Text>
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
