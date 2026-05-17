import { View, Image } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { Text } from '@/components/ui/Text';

export type ChatMessageBubbleProps = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: string;
  streaming?: boolean;
  imageUri?: string | null;
};

export function ChatMessageBubble({ role, content, createdAt, streaming = false, imageUri }: ChatMessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <View className={`mb-4 flex-row ${isUser ? 'justify-end' : 'justify-start'}`}>
      <View
        className={`max-w-[86%] rounded-3xl border px-4 py-3 ${
          isUser
            ? 'border-primary/30 bg-primary/15'
            : role === 'system'
              ? 'border-secondary/30 bg-secondary/10'
              : 'border-outline-variant bg-surface-container-high'
        }`}
      >
        {imageUri ? (
          <View className="mb-3 overflow-hidden rounded-2xl border border-outline-variant bg-black/20">
            <Image source={{ uri: imageUri }} className="h-56 w-full" resizeMode="contain" />
          </View>
        ) : null}
        <Markdown
          style={{
            body: {
              color: '#e8e0ee',
              fontSize: 15,
              lineHeight: 22,
            },
            paragraph: {
              marginTop: 0,
              marginBottom: 10,
            },
            heading1: {
              color: '#ffffff',
              marginBottom: 8,
            },
            heading2: {
              color: '#ffffff',
              marginBottom: 8,
            },
            code_inline: {
              backgroundColor: 'rgba(255,255,255,0.08)',
              borderRadius: 6,
              paddingHorizontal: 4,
              paddingVertical: 2,
              color: '#f4f0ff',
            },
            fence: {
              backgroundColor: 'rgba(255,255,255,0.06)',
              borderRadius: 14,
              padding: 12,
              color: '#f4f0ff',
            },
            blockquote: {
              borderLeftColor: '#d3bbff',
              borderLeftWidth: 3,
              paddingLeft: 12,
              opacity: 0.9,
            },
          }}
        >
          {content || (streaming ? 'Thinking…' : '')}
        </Markdown>
        {createdAt ? (
          <Text size="xs" className="mt-2 text-on-surface-variant/70">
            {new Date(createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
