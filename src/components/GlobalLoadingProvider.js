import React from 'react';
import { useSelector } from 'store';
import GlassmorphismLoader from './GlassmorphismLoader';

const GlobalLoadingProvider = () => {
  const { isLoading, message, subtitle } = useSelector((state) => state.loading);

  return (
    <GlassmorphismLoader
      open={isLoading}
      message={message}
      subtitle={subtitle}
    />
  );
};

export default GlobalLoadingProvider;