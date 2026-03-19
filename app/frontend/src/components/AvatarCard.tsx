import { Box, Paper, Stack, Typography } from '@mui/material';
import { useEffect, useRef, useState, type ReactNode } from 'react';

interface AvatarCardProps {
  statusText: string;
  isBusy?: boolean;
  children?: ReactNode;
}

export function AvatarCard({ statusText, isBusy = false, children }: AvatarCardProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [unityError, setUnityError] = useState<string | null>(null);
  const statusColor = isBusy ? '#f59e0b' : '#16a34a';

  useEffect(() => {
    const script = document.createElement('script');
    script.src = '/unity-build/Build/unity-build.loader.js';
    script.onerror = () => setUnityError('Failed to load Unity loader.');
    script.onload = () => {
      if (!canvasRef.current) return;
      (window as any)
        .createUnityInstance(canvasRef.current, {
          dataUrl: '/unity-build/Build/unity-build.data',
          frameworkUrl: '/unity-build/Build/unity-build.framework.js',
          codeUrl: '/unity-build/Build/unity-build.wasm',
        })
        .then((instance: any) => {
          window.unityInstance = instance;
        })
        .catch((err: Error) => setUnityError(err.message));
    };
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <Paper sx={{ p: { xs: 3, md: 4 }, height: '100%' }}>
      <Stack spacing={3} height="100%">
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h3">3D ASL Avatar</Typography>
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

        <Box
          id="unity-webgl-mount"
          sx={{
            flexGrow: 1,
            borderRadius: 3,
            bgcolor: '#000',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {unityError ? (
            <Typography color="error" sx={{ p: 2 }}>
              {unityError}
            </Typography>
          ) : (
            <canvas
              ref={canvasRef}
              id="unity-webgl-canvas"
              style={{ width: '100%', height: '100%', display: 'block' }}
            />
          )}
        </Box>
        {children}
      </Stack>
    </Paper>
  );
}
