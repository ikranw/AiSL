import { Box, Paper, Stack, Typography } from '@mui/material';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { flushPendingUnityPayload } from '../services/unityBridge';

interface AvatarCardProps {
  statusText: string;
  isBusy?: boolean;
  children?: ReactNode;
}

export function AvatarCard({
  statusText,
  isBusy = false,
  children,
}: AvatarCardProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const unityInstanceRef = useRef<any>(null);
  const initializedRef = useRef(false);
  const [unityError, setUnityError] = useState<string | null>(null);

  const statusColor = isBusy ? '#f59e0b' : '#16a34a';

  useEffect(() => {
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
          dataUrl: '/unity-build/Build/unity-build.data',
          frameworkUrl: '/unity-build/Build/unity-build.framework.js',
          codeUrl: '/unity-build/Build/unity-build.wasm',
          companyName: 'AiSL',
          productName: 'AiSL Avatar',
          productVersion: '1.0',
        })
        .then((instance: any) => {
          unityInstanceRef.current = instance;
          window.unityInstance = instance;
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
      script.src = '/unity-build/Build/unity-build.loader.js';
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
    };
  }, []);

  return (
    <Paper sx={{ p: 4, borderRadius: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={700}>
          3D ASL Avatar
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              bgcolor: statusColor,
            }}
          />
          <Typography variant="body1">{statusText}</Typography>
        </Stack>
      </Stack>

      {unityError ? (
        <Typography color="error">{unityError}</Typography>
      ) : (
        <canvas
          id="unity-canvas"
          ref={canvasRef}
          tabIndex={0}
          style={{
            width: '100%',
            height: 408,
            borderRadius: 24,
            outline: 'none',
            display: 'block',
          }}
        />
      )}

      {children}
    </Paper>
  );
}