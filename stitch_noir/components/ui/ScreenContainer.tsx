import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View, ViewProps } from 'react-native';
// NativeWind 4.x uses the babel plugin to enhance components.

interface ScreenContainerProps extends ViewProps {
  scrollable?: boolean;
}

export const ScreenContainer = ({ scrollable = true, children, className = '', ...props }: ScreenContainerProps) => {
  const content = (
    <View className={`flex-1 px-margin-mobile ${className}`} {...props}>
      {children}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      {scrollable ? (
        <ScrollView 
          className="flex-1" 
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
};
