import { View, ViewProps } from 'react-native';
// NativeWind 4.x uses the babel plugin to enhance components.

interface CardProps extends ViewProps {
  variant?: 'default' | 'elevated' | 'outline';
  className?: string;
}

export const Card = ({ variant = 'default', className = '', ...props }: CardProps) => {
  const variantClasses = {
    default: 'bg-surface-container',
    elevated: 'bg-surface-container-high',
    outline: 'bg-transparent border border-outline-variant',
  };

  return (
    <View
      className={`rounded-lg p-4 ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
};
