import React, { useState, useEffect } from 'react';
import { AlertCircle, ExternalLink, Maximize2, Loader2 } from 'lucide-react';

const blobCache = new Map<string, string>();

interface MediaImageProps {
  src: string;
  alt?: string;
  onPreview?: (src: string) => void;
  style?: React.CSSProperties;
  timestampOverlay?: React.ReactNode;
}

export const MediaImage: React.FC<MediaImageProps> = ({
  src,
  alt = 'Foto WhatsApp',
  onPreview,
  style,
  timestampOverlay,
}) => {
  const [blobSrc, setBlobSrc] = useState<string>(() => blobCache.get(src) || (src.startsWith('blob:') || src.startsWith('data:') ? src : ''));
  const [loading, setLoading] = useState<boolean>(!blobSrc);
  const [hasError, setHasError] = useState<boolean>(false);
  const [aspect, setAspect] = useState<'landscape' | 'square' | 'portrait' | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!src) {
      setHasError(true);
      setLoading(false);
      return;
    }

    if (blobCache.has(src)) {
      setBlobSrc(blobCache.get(src)!);
      setLoading(false);
      setHasError(false);
      return;
    }

    if (src.startsWith('blob:') || src.startsWith('data:')) {
      setBlobSrc(src);
      setLoading(false);
      setHasError(false);
      return;
    }

    setLoading(true);
    setHasError(false);

    // Fetch via CORS to bypass browser CORP restrictions
    fetch(src)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        blobCache.set(src, objectUrl);

        if (isMounted) {
          setBlobSrc(objectUrl);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('[MediaImage] Fetch as blob failed:', err);
        if (isMounted) {
          setHasError(true);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [src]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    if (naturalWidth && naturalHeight) {
      const ratio = naturalWidth / naturalHeight;
      if (ratio >= 1.22) {
        setAspect('landscape');
      } else if (ratio <= 0.82) {
        setAspect('portrait');
      } else {
        setAspect('square');
      }
    }
  };

  if (hasError) {
    return (
      <div
        style={{
          padding: '12px 14px',
          backgroundColor: '#12181D',
          borderRadius: '6px',
          border: '1px solid #222D35',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          fontSize: '12px',
          color: 'var(--text-muted)',
          width: '260px',
          maxWidth: '100%',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#F5A623', fontWeight: 500 }}>
          <AlertCircle size={16} />
          <span>Gambar tidak dapat dimuat</span>
        </div>
        <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)' }}>
          File media sementara mungkin sudah kedaluwarsa (&gt;1 jam) atau sesi terputus.
        </p>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            color: '#00A884',
            fontSize: '11px',
            textDecoration: 'none',
            marginTop: '2px',
          }}
        >
          <ExternalLink size={12} /> Buka tautan langsung
        </a>
      </div>
    );
  }

  // Calculate uniform, proportional bounding dimensions
  let containerWidth = '270px';
  let containerHeight = '190px';
  let objectFit: 'cover' | 'contain' = 'cover';

  if (aspect === 'landscape') {
    containerWidth = '280px';
    containerHeight = '180px';
    objectFit = 'cover';
  } else if (aspect === 'square') {
    // Square / QR codes: contain ensures entire QR code is visible with 0% cropping
    containerWidth = '250px';
    containerHeight = '250px';
    objectFit = 'contain';
  } else if (aspect === 'portrait') {
    containerWidth = '230px';
    containerHeight = '280px';
    objectFit = 'cover';
  }

  if (loading) {
    return (
      <div
        style={{
          width: containerWidth,
          height: containerHeight,
          maxWidth: '100%',
          borderRadius: '6px',
          backgroundColor: '#0B0F12',
          border: '1px solid #222D35',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          color: 'var(--text-muted)',
          fontSize: '12px',
        }}
      >
        <Loader2 size={20} className="spin-animate" color="#00A884" />
        <span style={{ fontSize: '11px' }}>Memuat gambar...</span>
      </div>
    );
  }

  return (
    <div
      style={{
        width: containerWidth,
        height: containerHeight,
        maxWidth: '100%',
        borderRadius: '6px',
        overflow: 'hidden',
        position: 'relative',
        cursor: 'pointer',
        backgroundColor: '#080C0E',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        ...style,
      }}
      onClick={() => onPreview?.(blobSrc || src)}
    >
      <img
        src={blobSrc}
        alt={alt}
        crossOrigin="anonymous"
        onLoad={handleImageLoad}
        onError={() => setHasError(true)}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          objectFit,
          borderRadius: '6px',
          userSelect: 'none',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: '6px',
          right: '6px',
          padding: '4px',
          borderRadius: '5px',
          backgroundColor: 'rgba(11, 15, 18, 0.65)',
          backdropFilter: 'blur(4px)',
          color: '#E6ECEF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
        }}
        title="Perbesar Foto (Lightbox)"
      >
        <Maximize2 size={12} />
      </div>

      {timestampOverlay && (
        <div
          style={{
            position: 'absolute',
            bottom: '6px',
            right: '6px',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        >
          {timestampOverlay}
        </div>
      )}
    </div>
  );
};
