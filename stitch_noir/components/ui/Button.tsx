import { Pressable, PressableProps, View } from 'react-native';
// NativeWind 4.x uses the babel plugin to enhance components.
import { Text } from './Text';
import { LucideIcon } from 'lucide-react-native';
import { useAppStore } from '@/store/useAppStore';

interface ButtonProps extends PressableProps {
  label?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  className?: string;
}

export const Button = ({
  label,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  className = '',
  ...props
}: ButtonProps) => {
  const themeMode = useAppStore((state) => state.themeMode);
  const isLight = themeMode === 'light';

  const variantClasses = {
    primary: 'bg-primary',
    secondary: 'bg-surface-high',
    outline: 'border border-outline bg-transparent',
    ghost: 'bg-transparent',
  };

  const sizeClasses = {
    sm: 'px-3 py-2 rounded-md',
    md: 'px-6 py-4 rounded-md',
    lg: 'px-8 py-5 rounded-lg',
  };

  const textClasses = {
    primary: 'text-background',
    secondary: 'text-on-surface',
    outline: 'text-on-surface',
    ghost: 'text-on-surface',
  };

  // Use shades of black rather than pure #000000 for contrast
  const darkShade = '#111111';
  const darkShade2 = '#1A1A1A';
  const lightShade = '#F3F3F3';

  let bgColor: string | undefined;
  let textColor: string;

  if (variant === 'primary') {
    bgColor = isLight ? darkShade : darkShade2;
    textColor = '#FFFFFF';
  } else if (variant === 'secondary') {
    bgColor = isLight ? lightShade : '#0D0D0D';
    textColor = isLight ? darkShade : lightShade;
  } else if (variant === 'outline' || variant === 'ghost') {
    bgColor = 'transparent';
    textColor = isLight ? darkShade : '#FFFFFF';
  } else {
    bgColor = undefined;
    textColor = isLight ? darkShade : '#FFFFFF';
  }

  const iconColor = textColor;

  return (
    <Pressable
      className={`flex-row items-center justify-center active:opacity-80 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      style={[{ backgroundColor: bgColor }, (props as any).style]}
      {...props}
    >
      {Icon && iconPosition === 'left' && (
        <Icon size={20} color={iconColor} className="mr-2" />
      )}
      {label && (
        <Text 
          weight="bold" 
          className={textClasses[variant]}
          size={size === 'lg' ? 'lg' : 'md'}
          style={{ color: textColor }}
        >
          {label}
        </Text>
      )}
      {Icon && iconPosition === 'right' && (
        <Icon size={20} color={iconColor} className="ml-2" />
      )}
    </Pressable>
  );
};
