import React from 'react';

interface SystemGlassWrapperProps {
  children: React.ReactNode;
  className?: string;
}

const SystemGlassWrapper: React.FC<SystemGlassWrapperProps> = ({ children, className = '' }) => {
  return (
    <div className={`glass-background min-h-screen w-full ${className}`}>
      {children}
    </div>
  );
};

export default SystemGlassWrapper;