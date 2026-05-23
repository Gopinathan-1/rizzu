import { Pressable, PressableProps, View } from 'react-native';
// NativeWind 4.x uses the babel plugin to enhance components.
import { Text } from './Text';
import { useAppStore } from '@/store/useAppStore';
import { CHOCOLATE_TRUFFLE_DARK, CHOCOLATE_TRUFFLE_LIGHT } from '@/theme/palette';

interface ButtonProps extends PressableProps {
  label?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: any;
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
    primary: 'text-white',
    secondary: 'text-on-surface',
    outline: 'text-on-surface',
    ghost: 'text-on-surface',
  };

  // Use shades of black rather than pure #000000 for contrast
  const darkShade = '#111111';
  const darkShade2 = CHOCOLATE_TRUFFLE_DARK.bgSurface;
  const lightShade = CHOCOLATE_TRUFFLE_LIGHT.bgElevated;

  let bgColor: string | undefined;
  let textColor: string;

  if (variant === 'primary') {
    bgColor = CHOCOLATE_TRUFFLE_LIGHT.accent;
    textColor = isLight ? CHOCOLATE_TRUFFLE_LIGHT.bgPrimary : CHOCOLATE_TRUFFLE_DARK.bgPrimary;
  } else if (variant === 'secondary') {
    bgColor = isLight ? CHOCOLATE_TRUFFLE_LIGHT.bgSurface : CHOCOLATE_TRUFFLE_DARK.bgSurface;
    textColor = isLight ? CHOCOLATE_TRUFFLE_LIGHT.textPrimary : CHOCOLATE_TRUFFLE_DARK.textPrimary;
  } else if (variant === 'outline' || variant === 'ghost') {
    bgColor = 'transparent';
    textColor = isLight ? CHOCOLATE_TRUFFLE_LIGHT.textPrimary : CHOCOLATE_TRUFFLE_DARK.textPrimary;
  } else {
    bgColor = undefined;
    textColor = isLight ? CHOCOLATE_TRUFFLE_LIGHT.textPrimary : CHOCOLATE_TRUFFLE_DARK.textPrimary;
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
