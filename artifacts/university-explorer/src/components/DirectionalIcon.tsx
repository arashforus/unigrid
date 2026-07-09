import React from 'react';
import { useLanguage } from '@/contexts/language';

export function DirectionalIcon({ 
  icon: Icon, 
  className = '', 
  ...props 
}: { 
  icon: React.ElementType, 
  className?: string,
  [key: string]: any 
}) {
  const { dir } = useLanguage();
  return <Icon className={`${className} ${dir === 'rtl' ? 'scale-x-[-1]' : ''}`} {...props} />;
}
