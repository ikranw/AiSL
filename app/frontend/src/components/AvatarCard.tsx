import { Box, Paper, Stack, Typography } from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import './AvatarCard.css';

interface AvatarCardProps {
  statusText: string;
  isBusy?: boolean;
  sequence?: string[];
  speed?: number;
  isPlaying?: boolean;
  isLooping?: boolean;
  seekToIndex?: number | null;
  onProgress?: (index: number, total: number) => void;
  onPlaybackEnd?: () => void;
  children?: ReactNode;
}

export function AvatarCard({
  statusText,
  isBusy = false,
  sequence = [],
  speed = 1,
  isPlaying = false,
  isLooping = false,
  seekToIndex = null,
  onProgress,
  onPlaybackEnd,
  children,
}: AvatarCardProps): JSX.Element {
  const videoA = useRef<HTMLVideoElement>(null);
  const videoB = useRef<HTMLVideoElement>(null);
  const [activeSlot, setActiveSlot] = useState<0 | 1>(0);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const statusColor = isBusy ? '#f59e0b' : '#16a34a';

  // Refs to avoid stale closures inside event handlers
  const sequenceRef = useRef(sequence);
  const speedRef = useRef(speed);
  const isPlayingRef = useRef(isPlaying);
  const isLoopingRef = useRef(isLooping);
  const activeSlotRef = useRef<0 | 1>(0);
  const currentIndexRef = useRef<number | null>(null);
  const onProgressRef = useRef(onProgress);
  const onPlaybackEndRef = useRef(onPlaybackEnd);

  useEffect(() => { sequenceRef.current = sequence; }, [sequence]);
  useEffect(() => { onProgressRef.current = onProgress; }, [onProgress]);
  useEffect(() => { onPlaybackEndRef.current = onPlaybackEnd; }, [onPlaybackEnd]);
  useEffect(() => { isLoopingRef.current = isLooping; }, [isLooping]);

  useEffect(() => {
    speedRef.current = speed;
    if (videoA.current) videoA.current.playbackRate = speed;
    if (videoB.current) videoB.current.playbackRate = speed;
  }, [speed]);

  // Pause or resume the active video when isPlaying changes
  useEffect(() => {
    isPlayingRef.current = isPlaying;
    if (currentIndexRef.current === null) return;
    const vid = (activeSlotRef.current === 0 ? videoA : videoB).current;
    if (!vid) return;
    if (isPlaying) {
      vid.playbackRate = speedRef.current;
      vid.play().catch(() => {});
    } else {
      vid.pause();
    }
  }, [isPlaying]);

  const getVideo = useCallback((slot: 0 | 1) => (slot === 0 ? videoA : videoB).current, []);

  const preload = useCallback((slot: 0 | 1, index: number) => {
    const seq = sequenceRef.current;
    const vid = getVideo(slot);
    if (!vid || index < 0 || index >= seq.length) return;
    vid.src = `/signs/${seq[index]}.mp4`;
    vid.load();
  }, [getVideo]);

  const playSlot = useCallback((slot: 0 | 1) => {
    const vid = getVideo(slot);
    if (!vid) return;
    vid.playbackRate = speedRef.current;
    if (isPlayingRef.current) vid.play().catch(() => {});
  }, [getVideo]);

  const jumpToIndex = useCallback((index: number) => {
    const seq = sequenceRef.current;
    if (seq.length === 0 || index < 0 || index >= seq.length) return;

    const slot: 0 | 1 = 0;
    activeSlotRef.current = slot;
    currentIndexRef.current = index;
    setActiveSlot(slot);
    setCurrentIndex(index);

    const vid = videoA.current;
    if (vid) {
      vid.src = `/signs/${seq[index]}.mp4`;
      vid.load();
      playSlot(slot);
    }
    preload(1, index + 1);
    onProgressRef.current?.(index, seq.length);
  }, [playSlot, preload]);

  // Called when the active clip ends or errors — swaps to the pre-buffered slot
  const advance = useCallback(() => {
    const seq = sequenceRef.current;
    const idx = currentIndexRef.current;
    const slot = activeSlotRef.current;

    const nextIndex = (idx ?? -1) + 1;
    if (nextIndex >= seq.length) {
      if (isLoopingRef.current && seq.length > 0) {
        jumpToIndex(0);
        return;
      }
      setCurrentIndex(null);
      currentIndexRef.current = null;
      onPlaybackEndRef.current?.();
      return;
    }

    const nextSlot: 0 | 1 = slot === 0 ? 1 : 0;
    activeSlotRef.current = nextSlot;
    currentIndexRef.current = nextIndex;
    setActiveSlot(nextSlot);
    setCurrentIndex(nextIndex);

    playSlot(nextSlot);
    preload(slot, nextIndex + 1);
    onProgressRef.current?.(nextIndex, seq.length);
  }, [jumpToIndex, playSlot, preload]);

  // Kick off playback whenever the sequence changes
  useEffect(() => {
    if (sequence.length === 0) {
      setCurrentIndex(null);
      currentIndexRef.current = null;
      return;
    }
    jumpToIndex(0);
  }, [sequence, jumpToIndex]);

  // Seek when the parent moves the slider
  useEffect(() => {
    if (seekToIndex === null || seekToIndex === undefined) return;
    jumpToIndex(seekToIndex);
  }, [seekToIndex, jumpToIndex]);

  const isActive = currentIndex !== null;
  const currentToken = currentIndex !== null ? sequence[currentIndex] : null;

  return (
    <Paper sx={{ p: { xs: 3, md: 4 }, height: '100%' }}>
      <Stack spacing={3} height="100%">
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h3">3D ASL Avatar</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: statusColor }} />
            <Typography variant="body2" color="text.secondary">
              {statusText}
            </Typography>
          </Stack>
        </Stack>

        <Box
          sx={{
            flexGrow: 1,
            borderRadius: 3,
            bgcolor: '#eef2f7',
            overflow: 'hidden',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {!isActive && (
            <Box sx={{ textAlign: 'center', p: 3 }}>
              <PersonOutlineIcon sx={{ fontSize: 56, color: 'text.secondary' }} />
              <Typography variant="subtitle1" sx={{ mt: 1 }}>
                {sequence.length > 0 ? 'Playback complete' : '3D Avatar will appear here'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {sequence.length === 0 && 'Enter text and translate to begin'}
              </Typography>
            </Box>
          )}

          {/* Slot A */}
          <video
            ref={videoA}
            muted
            onEnded={advance}
            onError={advance}
            className={`avatar-video${isActive && activeSlot === 0 ? '' : ' avatar-video--hidden'}`}
          />

          {/* Slot B — preloaded while A plays, swapped in instantly on A's end */}
          <video
            ref={videoB}
            muted
            onEnded={advance}
            onError={advance}
            className={`avatar-video${isActive && activeSlot === 1 ? '' : ' avatar-video--hidden'}`}
          />

          {currentToken && (
            <Box sx={{ position: 'absolute', bottom: 10, left: 0, right: 0, textAlign: 'center' }}>
              <Typography
                variant="caption"
                sx={{ bgcolor: 'rgba(0,0,0,0.55)', color: 'white', px: 1.5, py: 0.5, borderRadius: 1 }}
              >
                {currentToken} ({(currentIndex ?? 0) + 1} / {sequence.length})
              </Typography>
            </Box>
          )}
        </Box>

        {children}
      </Stack>
    </Paper>
  );
}
