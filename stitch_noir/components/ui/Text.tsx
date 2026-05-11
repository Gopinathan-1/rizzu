import { Text as RNText, TextProps } from 'react-native';
// NativeWind 4.x doesn't use styled(), it uses the babel plugin to enhance components.

interface AppTextProps extends TextProps {
  variant?: 'display' | 'headline' | 'body' | 'label';
  weight?: 'regular' | 'semibold' | 'bold';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
}

export const Text = ({ 
  variant = 'body', 
  weight = 'regular', 
  size, 
  className = '', 
  ...props 
}: AppTextProps) => {
  const fontClass = {
    regular: 'font-inter',
    semibold: 'font-inter-semibold',
    bold: 'font-inter-bold',
  }[weight];

  const variantClasses = {
    display: 'text-5xl font-inter-bold tracking-tighter leading-tight',
    headline: 'text-2xl font-inter-bold leading-8',
    body: 'text-base font-inter leading-6',
    label: 'text-[12px] font-inter-semibold tracking-[0.05em] uppercase',
  };

  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl',
  };

  const baseClass = size ? sizeClasses[size] : variantClasses[variant];

  return (
    <RNText 
      className={`${baseClass} ${fontClass} text-on-surface ${className}`} 
      {...props} 
    />
  );
};
