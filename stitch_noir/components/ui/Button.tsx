import { Pressable, PressableProps, View } from 'react-native';
// NativeWind 4.x uses the babel plugin to enhance components.
import { Text } from './Text';
import { LucideIcon } from 'lucide-react-native';

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
  const variantClasses = {
    primary: 'bg-primary-container',
    secondary: 'bg-secondary-container',
    outline: 'border border-outline bg-transparent',
    ghost: 'bg-transparent',
  };

  const sizeClasses = {
    sm: 'px-3 py-2 rounded-md',
    md: 'px-6 py-4 rounded-md',
    lg: 'px-8 py-5 rounded-lg',
  };

  const textClasses = {
    primary: 'text-on-primary-container',
    secondary: 'text-on-secondary-container',
    outline: 'text-on-surface',
    ghost: 'text-on-surface',
  };

  return (
    <Pressable
      className={`flex-row items-center justify-center active:opacity-80 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {Icon && iconPosition === 'left' && (
        <Icon size={20} color={variant === 'primary' ? '#dac5ff' : '#e8e0ee'} className="mr-2" />
      )}
      {label && (
        <Text 
          weight="bold" 
          className={textClasses[variant]}
          size={size === 'lg' ? 'lg' : 'md'}
        >
          {label}
        </Text>
      )}
      {Icon && iconPosition === 'right' && (
        <Icon size={20} color={variant === 'primary' ? '#dac5ff' : '#e8e0ee'} className="ml-2" />
      )}
    </Pressable>
  );
};
