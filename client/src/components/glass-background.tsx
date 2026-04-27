import React from 'react';

interface GlassBackgroundProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'container' | 'header' | 'input' | 'button';
}

const GlassBackground: React.FC<GlassBackgroundProps> = ({ 
  children, 
  className = '', 
  variant = 'default' 
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'container':
        return 'glass-container';
      case 'header':
        return 'glass-header';
      case 'input':
        return 'glass-input';
      case 'button':
        return 'glass-button';
      default:
        return 'system-glass-background';
    }
  };

  return (
    <div className={`${getVariantClass()} ${className}`}>
      {children}
    </div>
  );
};

export default GlassBackground;