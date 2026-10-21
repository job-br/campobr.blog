import React, { useState, useEffect } from 'react';
import { 
  getOptimizedImageUrl, 
  getResponsiveImageProps, 
  DEFAULT_FALLBACK_IMAGE,
  preloadImage 
} from '../services/imageOptimizer';

export interface FastImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  widthTarget?: number;
  priority?: boolean;
  aspectRatio?: 'video' | 'square' | 'wide' | 'auto';
  containerClassName?: string;
  fallbackSrc?: string;
}

/**
 * Normaliza e repara URLs de imagem (incluindo Data URIs de SVG com cabeçalho inválido)
 */
function sanitizeImageSource(raw: string | undefined | null): string {
  if (!raw || typeof raw !== 'string') return DEFAULT_FALLBACK_IMAGE;
  const trimmed = raw.trim();
  if (trimmed.startsWith('data:image/svg+xml;utf8,')) {
    return trimmed.replace('data:image/svg+xml;utf8,', 'data:image/svg+xml;charset=utf-8,');
  }
  return trimmed;
}

export const FastImage: React.FC<FastImageProps> = ({
  src,
  alt,
  widthTarget = 800,
  priority = false,
  aspectRatio = 'auto',
  className = '',
  containerClassName = '',
  fallbackSrc = DEFAULT_FALLBACK_IMAGE,
  onError,
  onLoad,
  ...rest
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(() => {
    const clean = sanitizeImageSource(src);
    return getOptimizedImageUrl(clean, { width: widthTarget });
  });

  // Re-sync when src or widthTarget changes
  useEffect(() => {
    setHasError(false);
    setIsLoaded(false);
    const clean = sanitizeImageSource(src);
    const optimized = getOptimizedImageUrl(clean, { width: widthTarget });
    setCurrentSrc(optimized);

    if (priority && optimized && !optimized.startsWith('data:')) {
      preloadImage(optimized, widthTarget);
    }

    // Safety watchdog: se a imagem não disparar onLoad em 2.5s, libera a visualização para não travar
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, [src, widthTarget, priority]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoaded(true);
    if (onLoad) onLoad(e);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (!hasError) {
      setHasError(true);
      setCurrentSrc(fallbackSrc);
      // Libera exibição da imagem de fallback
      setIsLoaded(true);
    } else {
      setIsLoaded(true);
    }
    if (onError) onError(e);
  };

  const responsiveProps = (!hasError && currentSrc && !currentSrc.startsWith('data:'))
    ? getResponsiveImageProps(currentSrc, widthTarget) 
    : { src: currentSrc };

  const aspectClass = {
    video: 'aspect-video',
    square: 'aspect-square',
    wide: 'aspect-[21/9]',
    auto: '',
  }[aspectRatio];

  return (
    <div 
      className={`relative overflow-hidden bg-slate-950 ${aspectClass} ${containerClassName}`}
    >
      {/* Shimmering Skeleton Loader com transição suave */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 animate-pulse flex items-center justify-center z-10">
          <div className="w-7 h-7 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin"></div>
        </div>
      )}

      {/* Optimized Image Tag com fallback garantido */}
      <img
        src={currentSrc}
        srcSet={responsiveProps.srcSet}
        sizes={responsiveProps.sizes}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding={currentSrc.startsWith('data:') ? 'auto' : 'async'}
        fetchPriority={priority ? 'high' : 'auto'}
        referrerPolicy="no-referrer"
        onLoad={handleImageLoad}
        onError={handleImageError}
        className={`w-full h-full object-cover transition-opacity duration-300 ease-out ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        {...rest}
      />
    </div>
  );
};
