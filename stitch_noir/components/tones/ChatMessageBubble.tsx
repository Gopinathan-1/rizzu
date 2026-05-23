import { View, Image } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { Text } from '@/components/ui/Text';
import { useAppStore } from '@/store/useAppStore';
import { CHOCOLATE_TRUFFLE_DARK, CHOCOLATE_TRUFFLE_LIGHT } from '@/theme/palette';

export type ChatMessageBubbleProps = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: string;
  streaming?: boolean;
  imageUri?: string | null;
};

export function ChatMessageBubble({ role, content, createdAt, streaming = false, imageUri }: ChatMessageBubbleProps) {
  const isUser = role === 'user';
  const themeMode = useAppStore((state) => state.themeMode);
  const isLight = themeMode === 'light';
  const bodyColor = isLight ? CHOCOLATE_TRUFFLE_LIGHT.textPrimary : CHOCOLATE_TRUFFLE_DARK.textPrimary;
  const headingColor = bodyColor;
  const codeColor = bodyColor;
  const codeBackground = isLight ? CHOCOLATE_TRUFFLE_LIGHT.accentSubtle : CHOCOLATE_TRUFFLE_DARK.accentSubtle;
  const fenceBackground = isLight ? CHOCOLATE_TRUFFLE_LIGHT.bgElevated : CHOCOLATE_TRUFFLE_DARK.bgElevated;

  return (
    <View className={`mb-4 flex-row ${isUser ? 'justify-end' : 'justify-start'}`}>
      <View
        className={`max-w-[86%] rounded-3xl border px-4 py-3 ${
          isUser
            ? isLight
              ? 'border-border bg-user-bubble'
              : 'border-border bg-user-bubble'
            : role === 'system'
              ? isLight
                ? 'border-border bg-bg-surface'
                : 'border-border bg-bg-surface'
              : isLight
                ? 'border-border bg-ai-bubble'
                : 'border-border bg-ai-bubble'
        }`}
      >
        {imageUri ? (
          <View className="mb-3 overflow-hidden rounded-2xl border border-outline-variant bg-accent/10">
            <Image source={{ uri: imageUri }} className="h-56 w-full" resizeMode="contain" />
          </View>
        ) : null}
        <Markdown
          style={{
            body: {
              color: bodyColor,
              fontSize: 15,
              lineHeight: 22,
            },
            paragraph: {
              marginTop: 0,
              marginBottom: 10,
            },
            heading1: {
              color: headingColor,
              marginBottom: 8,
            },
            heading2: {
              color: headingColor,
              marginBottom: 8,
            },
            code_inline: {
              backgroundColor: codeBackground,
              borderRadius: 6,
              paddingHorizontal: 4,
              paddingVertical: 2,
              color: codeColor,
            },
            fence: {
              backgroundColor: fenceBackground,
              borderRadius: 14,
              padding: 12,
              color: codeColor,
            },
            blockquote: {
              borderLeftColor: isLight ? CHOCOLATE_TRUFFLE_LIGHT.textSecondary : CHOCOLATE_TRUFFLE_DARK.textSecondary,
              borderLeftWidth: 3,
              paddingLeft: 12,
              opacity: 0.9,
            },
          }}
        >
          {content || (streaming ? 'Thinking…' : '')}
        </Markdown>
        {createdAt ? (
          <Text size="xs" className="mt-2 text-text-secondary">
            {new Date(createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
