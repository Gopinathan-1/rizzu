import { useEffect, useMemo } from 'react';
import { BackHandler, Pressable, StyleSheet, View, useWindowDimensions, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  FadeIn,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Menu } from 'lucide-react-native';
import { ChatSidebar } from '@/components/tones/ChatSidebar';
import type { WorkspaceChat } from '@/services/chatWorkspace';

type DrawerGroup = {
  label: string;
  items: WorkspaceChat[];
};

type MemoryDrawerProps = {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  searchText: string;
  onSearchTextChange: (value: string) => void;
  onNewChat: () => void;
  chatsByGroup: DrawerGroup[];
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onRenameChat: (chat: WorkspaceChat) => void;
  onDeleteChat: (chat: WorkspaceChat) => void;
};

function clamp(value: number, lower: number, upper: number) {
  return Math.min(Math.max(value, lower), upper);
}

function DrawerToggleButton({ open, onPress }: { open: boolean; onPress: () => void }) {
  const progress = useSharedValue(open ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(open ? 1 : 0, {
      damping: 16,
      stiffness: 170,
      mass: 0.9,
    });
  }, [open, progress]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(progress.value, [0, 1], [1, 1.04]) }],
    shadowOpacity: interpolate(progress.value, [0, 1], [0.18, 0.35]),
  }));

  return (
    <Animated.View
      style={[styles.toggleShadow, containerStyle]}
      className="absolute left-3 top-3 z-50 overflow-hidden rounded-[16px] border border-white/10 bg-surface-container/80"
    >
      <Pressable onPress={onPress} className="h-11 w-11 items-center justify-center active:opacity-80">
        <Menu size={20} color="#f4effe" />
      </Pressable>
    </Animated.View>
  );
}

export function MemoryDrawer({
  open,
  onOpenChange,
  searchText,
  onSearchTextChange,
  onNewChat,
  chatsByGroup,
  selectedChatId,
  onSelectChat,
  onRenameChat,
  onDeleteChat,
}: MemoryDrawerProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const drawerWidth = isMobile ? width : Math.min(420, Math.max(340, width * 0.32));
  const progress = useSharedValue(open ? 1 : 0);
  const gestureStart = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(open ? 1 : 0, {
      damping: 16,
      stiffness: 170,
      mass: 0.9,
    });
  }, [open, progress]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    if (open) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false);
      }
    };

    let backSubscription: ReturnType<typeof BackHandler.addEventListener> | null = null;

    if (Platform.OS !== 'web') {
      backSubscription = BackHandler.addEventListener('hardwareBackPress', () => {
        onOpenChange(false);
        return true;
      });
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.addEventListener('keydown', onKeyDown);
    }

    return () => {
      backSubscription?.remove();
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.removeEventListener('keydown', onKeyDown);
      }
    };
  }, [open, onOpenChange]);

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(progress.value, [0, 1], [-drawerWidth, 0]) }],
    shadowOpacity: interpolate(progress.value, [0, 1], [0, 0.35]),
    opacity: progress.value === 0 ? 0 : 1,
  }), [drawerWidth]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
  }));

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(open)
        .activeOffsetX([-12, 12])
        .failOffsetY([-16, 16])
        .onBegin(() => {
          gestureStart.value = progress.value;
        })
        .onUpdate((event) => {
          const nextProgress = clamp(gestureStart.value + event.translationX / drawerWidth, 0, 1);
          progress.value = nextProgress;
        })
        .onEnd((event) => {
          const shouldClose = progress.value < 0.45 || event.velocityX < -700;
          runOnJS(onOpenChange)(!shouldClose);
        }),
    [drawerWidth, gestureStart, onOpenChange, open, progress]
  );

  return (
    <View pointerEvents="box-none" className="absolute inset-0 z-40">
      <DrawerToggleButton open={open} onPress={() => onOpenChange(!open)} />

      <Animated.View pointerEvents={open ? 'auto' : 'none'} style={[StyleSheet.absoluteFillObject, backdropStyle]} className="bg-black/55">
        <Pressable onPress={() => onOpenChange(false)} className="flex-1">
          <BlurView intensity={isMobile ? 34 : 18} tint="dark" style={StyleSheet.absoluteFillObject} />
        </Pressable>
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[panelStyle, { width: drawerWidth }]}
          pointerEvents={open ? 'auto' : 'none'}
          className={`absolute left-0 top-0 h-full overflow-hidden border-r border-white/10 bg-surface-container/95 shadow-2xl shadow-black/60 ${isMobile ? '' : 'rounded-r-[32px]'}`}
        >
          <Animated.View entering={FadeIn.duration(180)} className="h-full">
            <View className="h-full bg-surface-container/95">
              <View className="flex-row items-center justify-between border-b border-white/10 py-4 pl-16 pr-4">
                <View>
                  <Animated.Text entering={FadeIn.duration(220)} className="text-[11px] font-inter-semibold uppercase tracking-[0.28em] text-on-surface-variant">
                    Memory
                  </Animated.Text>
                  <Animated.Text entering={FadeIn.duration(260)} className="text-lg font-inter-bold text-on-surface">
                    Personal AI workspace
                  </Animated.Text>
                </View>
              </View>

              <ChatSidebar
                compact
                showHeader={false}
                searchText={searchText}
                onSearchTextChange={onSearchTextChange}
                onNewChat={onNewChat}
                chatsByGroup={chatsByGroup}
                selectedChatId={selectedChatId}
                onSelectChat={onSelectChat}
                onRenameChat={onRenameChat}
                onDeleteChat={onDeleteChat}
              />
            </View>
          </Animated.View>
        </Animated.View>
      </GestureDetector>

    </View>
  );
}

const styles = StyleSheet.create({
  toggleShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 24,
    elevation: 20,
  },
  bar: {
    shadowColor: '#d3bbff',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
  },
});