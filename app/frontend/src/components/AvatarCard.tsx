import { Box, Paper, Stack, Typography } from '@mui/material';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { flushPendingUnityPayload } from '../services/unityBridge';

const UNITY_BUILD_VERSION = '2026-04-04-sign-token-overlay';

interface AvatarCardProps {
  statusText: string;
  activeToken?: string;
  activeTokenIndex?: number;
  totalTokens?: number;
  isBusy?: boolean;
  children?: ReactNode;
}

export function AvatarCard({
  statusText,
  activeToken,
  activeTokenIndex = -1,
  totalTokens = 0,
  isBusy = false,
  children,
}: AvatarCardProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const unityInstanceRef = useRef<any>(null);
  const initializedRef = useRef(false);
  const [unityError, setUnityError] = useState<string | null>(null);
  const [shouldLoadUnity, setShouldLoadUnity] = useState(false);
  const [isUnityReady, setIsUnityReady] = useState(false);

  const statusColor = isBusy ? '#f59e0b' : '#16a34a';

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoadUnity(true);
          observer.disconnect();
        }
      },
      { rootMargin: '240px 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!shouldLoadUnity || initializedRef.current) return;
    if (initializedRef.current) return;
    initializedRef.current = true;

    const existingScript = document.querySelector(
      'script[data-unity-loader="aisl"]'
    ) as HTMLScriptElement | null;

    const startUnity = () => {
      if (!canvasRef.current) return;
      const unityCanvas = canvasRef.current;

      (window as any)
        .createUnityInstance(unityCanvas, {
          dataUrl: `/unity-build/Build/unity-build.data?v=${UNITY_BUILD_VERSION}`,
          frameworkUrl: `/unity-build/Build/unity-build.framework.js?v=${UNITY_BUILD_VERSION}`,
          codeUrl: `/unity-build/Build/unity-build.wasm?v=${UNITY_BUILD_VERSION}`,
          companyName: 'AiSL',
          productName: 'AiSL Avatar',
          productVersion: '1.0',
          cacheControl: (url: string) =>
            url.includes('/unity-build/Build/') ? 'immutable' : 'no-store',
        })
        .then((instance: any) => {
          unityInstanceRef.current = instance;
          window.unityInstance = instance;
          setIsUnityReady(true);
          flushPendingUnityPayload();
        })
        .catch((err: Error) => {
          setUnityError(err.message);
        });
    };

    if ((window as any).createUnityInstance) {
      startUnity();
    } else if (!existingScript) {
      const script = document.createElement('script');
      script.src = `/unity-build/Build/unity-build.loader.js?v=${UNITY_BUILD_VERSION}`;
      script.dataset.unityLoader = 'aisl';
      script.onload = startUnity;
      script.onerror = () => setUnityError('Failed to load Unity loader.');
      document.body.appendChild(script);
    } else {
      existingScript.addEventListener('load', startUnity, { once: true });
    }

    return () => {
      if (unityInstanceRef.current?.Quit) {
        unityInstanceRef.current.Quit();
      }
      unityInstanceRef.current = null;
      window.unityInstance = undefined;
      initializedRef.current = false;
      setIsUnityReady(false);
    };
  }, [shouldLoadUnity]);

  return (
    <Paper sx={{ p: { xs: 3, md: 3.5 }, borderRadius: 3, height: '100%' }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2.5}
        sx={{ gap: 2 }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            letterSpacing: '-0.01em',
          }}
        >
          3D ASL Avatar
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              bgcolor: statusColor,
            }}
          />
          <Typography variant="body2" color="text.secondary">
            {statusText}
          </Typography>
        </Stack>
      </Stack>

      {unityError ? (
        <Typography color="error">{unityError}</Typography>
      ) : (
        <Box
          ref={containerRef}
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            bgcolor: '#edf2f7',
            border: '1px solid',
            borderColor: 'divider',
            position: 'relative',
          }}
        >
          <canvas
            id="unity-canvas"
            ref={canvasRef}
            tabIndex={0}
            style={{
              width: '100%',
              height: 360,
              outline: 'none',
              display: 'block',
            }}
            />
          {!!activeToken && (
            <Box
              sx={{
                position: 'absolute',
                left: 16,
                right: 16,
                bottom: 12,
                display: 'flex',
                justifyContent: 'center',
                pointerEvents: 'none',
              }}
            >
              <Box
                sx={{
                  px: 1.25,
                  py: 0.5,
                  borderRadius: 999,
                  bgcolor: 'rgba(255, 255, 255, 0.54)',
                  color: '#1f2937',
                  border: '1px solid rgba(255, 255, 255, 0.35)',
                  backdropFilter: 'blur(4px)',
                  maxWidth: '100%',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    textAlign: 'center',
                    fontWeight: 600,
                    letterSpacing: '0.02em',
                  }}
                >
                  {activeTokenIndex >= 0 && totalTokens > 0 ? `${activeTokenIndex + 1}/${totalTokens} ` : ''}
                  {activeToken}
                </Typography>
              </Box>
            </Box>
          )}
          {!isUnityReady && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(237, 242, 247, 0.92)',
              }}
            >
              <Stack spacing={0.75} alignItems="center">
                <Typography variant="body1" fontWeight={600}>
                  Loading avatar...
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Large 3D files may take a moment.
                </Typography>
              </Stack>
            </Box>
          )}
        </Box>
      )}

      {children}
    </Paper>
  );
}
