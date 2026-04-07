import { Box, Paper, Stack, Tooltip, Typography } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { flushPendingUnityPayload } from '../services/unityBridge';

const UNITY_BUILD_VERSION = '2026-04-04-fingerspelling-overlay';

interface AvatarCardProps {
  statusText: string;
  activeToken?: string;
  activeTokenIndex?: number;
  totalTokens?: number;
  isBusy?: boolean;
  activeTokenInfoMessage?: string | null;
  headerControl?: ReactNode;
  children?: ReactNode;
}

export function AvatarCard({
  statusText,
  activeToken,
  activeTokenIndex = -1,
  totalTokens = 0,
  isBusy = false,
  activeTokenInfoMessage = null,
  headerControl,
  children,
}: AvatarCardProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const unityInstanceRef = useRef<any>(null);
  const initializedRef = useRef(false);
  const [unityError, setUnityError] = useState<string | null>(null);
  const [shouldLoadUnity, setShouldLoadUnity] = useState(false);
  const [isUnityReady, setIsUnityReady] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  const statusColor = isBusy ? '#f59e0b' : '#16a34a';
  const progressPrefix =
    activeTokenIndex >= 0 && totalTokens > 0 ? `${activeTokenIndex + 1}/${totalTokens}` : null;

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

      if (typeof (window as any).createUnityInstance !== 'function') {
        setUnityError('Unity loader script loaded, but createUnityInstance was not available.');
        return;
      }

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
        }, (progress: number) => {
          setLoadProgress(progress);
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
      script.async = true;
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
    <Paper sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3, height: '100%' }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        flexWrap="wrap"
        mb={2}
        sx={{ gap: 1.5 }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            letterSpacing: '-0.01em',
          }}
        >
          {headerControl ?? '3D ASL Avatar'}
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
            height: { xs: 380, md: 430 },
            minHeight: { xs: 380, md: 430 },
          }}
        >
          <canvas
            id="unity-canvas"
            ref={canvasRef}
            tabIndex={0}
            style={{
              width: '100%',
              height: '100%',
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
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 0.75,
                    textAlign: 'center',
                    fontWeight: 600,
                    letterSpacing: '0.02em',
                  }}
                >
                  <span>
                    {progressPrefix ? `${progressPrefix} ` : ''}
                    {activeToken}
                  </span>
                  {activeTokenInfoMessage ? (
                    <Tooltip title={activeTokenInfoMessage} arrow>
                      <InfoOutlinedIcon sx={{ fontSize: 14, pointerEvents: 'auto' }} />
                    </Tooltip>
                  ) : null}
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
              <Stack spacing={1.5} alignItems="center" sx={{ width: '60%', maxWidth: 260 }}>
                <Typography variant="body1" fontWeight={600}>
                  Loading avatar...
                </Typography>
                <Box
                  sx={{
                    width: '100%',
                    height: 6,
                    borderRadius: 3,
                    bgcolor: 'rgba(0, 0, 0, 0.08)',
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      width: `${Math.round(loadProgress * 100)}%`,
                      height: '100%',
                      borderRadius: 3,
                      bgcolor: '#6366f1',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {Math.round(loadProgress * 100)}%
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
