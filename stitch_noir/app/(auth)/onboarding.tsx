import React, { useMemo, useState } from 'react';
import { View, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react-native';
import { Text } from '@/components/ui/Text';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAppStore } from '@/store/useAppStore';
import {
  buildToneProfileFromOnboarding,
  normalizeToneName,
  TONE_OPTIONS,
  type OnboardingToneAnswers,
} from '@/lib/tonePrompts';
import { CHOCOLATE_TRUFFLE_DARK, CHOCOLATE_TRUFFLE_LIGHT } from '@/theme/palette';

type StepKey = keyof OnboardingToneAnswers;

const QUESTIONS: Array<{
  key: StepKey;
  title: string;
  subtitle: string;
  options: readonly string[];
}> = [
  {
    key: 'useCase',
    title: 'What are you using RIZZ for?',
    subtitle: 'This sets the overall tone pack.',
    options: ['Dating', 'Social', 'Work', 'Everything'] as const,
  },
  {
    key: 'energy',
    title: 'What energy should the replies carry?',
    subtitle: 'Pick the personality the app should lean into.',
    options: ['Playful', 'Mysterious', 'Bold', 'Professional', 'Flirty'] as const,
  },
  {
    key: 'directness',
    title: 'How direct should it feel?',
    subtitle: 'This keeps the tone from being too soft or too sharp.',
    options: ['Soft', 'Balanced', 'Sharp'] as const,
  },
  {
    key: 'length',
    title: 'How long should the replies be?',
    subtitle: 'We’ll tune the generated output length.',
    options: ['Short', 'Balanced', 'Flexible'] as const,
  },
  {
    key: 'primaryTone',
    title: 'Choose your primary tone.',
    subtitle: 'We’ll add personalized extra tones around this choice.',
    options: TONE_OPTIONS,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const themeMode = useAppStore((state) => state.themeMode);
  const setToneProfile = useAppStore((state) => state.setToneProfile);
  const setActiveTone = useAppStore((state) => state.setActiveTone);
  const isLight = themeMode === 'light';
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<OnboardingToneAnswers>({
    useCase: 'Social',
    energy: 'Playful',
    directness: 'Balanced',
    length: 'Balanced',
    primaryTone: 'Witty',
  });

  const currentQuestion = QUESTIONS[stepIndex];
  const toneProfile = useMemo(() => buildToneProfileFromOnboarding(answers), [answers]);

  const updateAnswer = (key: StepKey, value: string) => {
    setAnswers((current) => ({
      ...current,
      [key]: value,
    }) as OnboardingToneAnswers);
  };

  const goNext = () => {
    if (stepIndex < QUESTIONS.length - 1) {
      setStepIndex((current) => current + 1);
      return;
    }

    setToneProfile(toneProfile);
    setActiveTone(normalizeToneName(toneProfile.primaryTone));
    router.push('/(auth)/signup');
  };

  const goBack = () => {
    if (stepIndex === 0) {
      return;
    }

    setStepIndex((current) => current - 1);
  };

  return (
    <ScreenContainer className="bg-background">
      <View className="flex-1 justify-between py-6">
        <View className="gap-6">
          <View className="w-28 h-28 bg-surface-low rounded-[28px] items-center justify-center border border-outline-variant shadow-2xl self-center">
            <Image
              source={{ uri: 'https://i.ibb.co/LhqZz1z/screen.png' }}
              className="w-20 h-20"
              resizeMode="contain"
            />
          </View>

          <View className="items-center px-2">
            <Text variant="display" className="text-center text-5xl tracking-tightest leading-[1] mb-4">Elite Social{"\n"}Intelligence.</Text>
            <View className="flex-row items-center gap-2 justify-center mb-4">
              <View className="w-1.5 h-1.5 rounded-full bg-primary" />
              <Text weight="bold" size="sm" className="text-primary tracking-widest uppercase">Powered by Aura AI</Text>
            </View>
            <Text className="text-center text-on-surface-variant text-base leading-relaxed font-inter opacity-80 max-w-[340px]">
              Tell us how you text and we’ll shape the tone pack around it before signup.
            </Text>
          </View>
        </View>

        <View className="gap-5 pb-2">
          <View className="flex-row items-center justify-between">
            <Text size="sm" className="text-on-surface-variant">Step {stepIndex + 1} of {QUESTIONS.length}</Text>
            <Text size="sm" className="text-primary font-bold uppercase tracking-widest">{currentQuestion.key}</Text>
          </View>

          <Card className="rounded-[28px] border border-border bg-bg-elevated p-5">
            <Text variant="headline" className="text-2xl tracking-tight leading-tight">{currentQuestion.title}</Text>
            <Text className="mt-2 text-on-surface-variant leading-relaxed">{currentQuestion.subtitle}</Text>

            <View className="mt-5 gap-3">
              {currentQuestion.options.map((option) => {
                const selected = answers[currentQuestion.key] === option;
                return (
                  <Pressable
                    key={option}
                    onPress={() => updateAnswer(currentQuestion.key, option)}
                    className="rounded-2xl border px-4 py-4"
                    style={{
                      borderColor: selected ? CHOCOLATE_TRUFFLE_LIGHT.accent : undefined,
                      backgroundColor: selected ? CHOCOLATE_TRUFFLE_LIGHT.accent : undefined,
                    }}
                  >
                    <View className="flex-row items-center justify-between">
                      <Text weight="bold" className={selected ? 'text-background' : 'text-on-surface'}>
                        {option}
                      </Text>
                      {selected ? <Check size={18} color={CHOCOLATE_TRUFFLE_LIGHT.bgPrimary} /> : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </Card>

          {stepIndex === QUESTIONS.length - 1 ? (
            <Card className="rounded-[28px] border border-border bg-bg-surface p-5">
              <Text weight="bold" className="text-on-surface">Your personalized tone pack</Text>
              <Text className="mt-1 text-sm text-on-surface-variant">{toneProfile.summary}</Text>
              <View className="mt-4 flex-row flex-wrap gap-2">
                {[toneProfile.primaryTone, ...toneProfile.extraTones].slice(0, 6).map((tone) => (
                  <View key={tone} className="rounded-full border border-outline-variant px-3 py-2">
                    <Text size="xs" className="text-on-surface font-bold uppercase tracking-widest">{tone}</Text>
                  </View>
                ))}
              </View>
            </Card>
          ) : null}

          <View className="flex-row items-center justify-between gap-3 pt-1">
            <Pressable
              onPress={goBack}
              disabled={stepIndex === 0}
              className="h-14 w-14 items-center justify-center rounded-full border border-border bg-bg-surface"
              style={{ opacity: stepIndex === 0 ? 0.45 : 1 }}
            >
              <ArrowLeft size={20} color={isLight ? CHOCOLATE_TRUFFLE_LIGHT.textPrimary : CHOCOLATE_TRUFFLE_DARK.textPrimary} />
            </Pressable>

            <Button
              label={stepIndex === QUESTIONS.length - 1 ? 'Continue to signup' : 'Next'}
              icon={ArrowRight}
              iconPosition="right"
              className="flex-1 rounded-2xl"
              onPress={goNext}
            />
          </View>

          <Pressable onPress={() => router.push('/(auth)/login')} className="items-center pt-2">
            <Text className="text-on-surface-variant font-inter">
              Already have an account? <Text className="text-primary font-inter-bold">Log In</Text>
            </Text>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}
