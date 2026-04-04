import { Box, Paper, Stack, Tooltip, Typography, type SxProps, type Theme } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import './VideoAvatarCard.css';

type PlaybackEntry = {
  clipToken: string;
  sourceIndex: number;
  sourceToken: string;
  displayLabel: string;
  isFallbackFingerspelling: boolean;
  letterIndex: number | null;
  letterTotal: number | null;
};

interface VideoAvatarCardProps {
  statusText: string;
  isBusy?: boolean;
  sequence?: string[];
  speed?: number;
  isPlaying?: boolean;
  isLooping?: boolean;
  seekToIndex?: number | null;
  playbackVersion?: number;
  onProgress?: (index: number, total: number) => void;
  onPlaybackEnd?: () => void;
  headerControl?: ReactNode;
  children?: ReactNode;
  sx?: SxProps<Theme>;
}

export function VideoAvatarCard({
  statusText,
  isBusy = false,
  sequence = [],
  speed = 1,
  isPlaying = false,
  isLooping = false,
  seekToIndex = null,
  playbackVersion = 0,
  onProgress,
  onPlaybackEnd,
  headerControl,
  children,
  sx,
}: VideoAvatarCardProps): JSX.Element {
  const videoA = useRef<HTMLVideoElement>(null);
  const videoB = useRef<HTMLVideoElement>(null);
  const [activeSlot, setActiveSlot] = useState<0 | 1>(0);
  const [playbackEntries, setPlaybackEntries] = useState<PlaybackEntry[]>([]);
  const [currentEntryIndex, setCurrentEntryIndex] = useState<number | null>(null);
  const statusColor = isBusy ? '#f59e0b' : '#16a34a';

  const sequenceRef = useRef(sequence);
  const playbackEntriesRef = useRef<PlaybackEntry[]>([]);
  const speedRef = useRef(speed);
  const isPlayingRef = useRef(isPlaying);
  const isLoopingRef = useRef(isLooping);
  const activeSlotRef = useRef<0 | 1>(0);
  const slotEntryIndexRef = useRef<[number | null, number | null]>([null, null]);
  const currentEntryIndexRef = useRef<number | null>(null);
  const currentSourceIndexRef = useRef<number | null>(null);
  const onProgressRef = useRef(onProgress);
  const onPlaybackEndRef = useRef(onPlaybackEnd);

  useEffect(() => {
    sequenceRef.current = sequence;
  }, [sequence]);

  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

  useEffect(() => {
    onPlaybackEndRef.current = onPlaybackEnd;
  }, [onPlaybackEnd]);

  useEffect(() => {
    isLoopingRef.current = isLooping;
  }, [isLooping]);

  useEffect(() => {
    speedRef.current = speed;
    if (videoA.current) {
      videoA.current.playbackRate = speed;
    }
    if (videoB.current) {
      videoB.current.playbackRate = speed;
    }
  }, [speed]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
    if (currentEntryIndexRef.current === null) {
      return;
    }

    const activeVideo = (activeSlotRef.current === 0 ? videoA : videoB).current;
    if (!activeVideo) {
      return;
    }

    if (isPlaying) {
      activeVideo.playbackRate = speedRef.current;
      activeVideo.play().catch(() => {});
      return;
    }

    activeVideo.pause();
  }, [isPlaying]);

  const getVideo = useCallback((slot: 0 | 1) => {
    return slot === 0 ? videoA.current : videoB.current;
  }, []);

  const setSlotEntryIndex = useCallback((slot: 0 | 1, entryIndex: number | null) => {
    slotEntryIndexRef.current[slot] = entryIndex;
  }, []);

  const getSlotEntryIndex = useCallback((slot: 0 | 1) => {
    return slotEntryIndexRef.current[slot];
  }, []);

  const buildVideoSrc = useCallback((token: string) => {
    return `/signs/${encodeURIComponent(token)}.mp4`;
  }, []);

  const normalizeSourceToken = useCallback((token: string) => {
    let normalized = token.trim().toUpperCase();

    const nestedFingerspellMatch = normalized.match(/^FINGERSPELL\(FINGERSPELL\((.+)\)\)$/);
    if (nestedFingerspellMatch) {
      normalized = nestedFingerspellMatch[1].trim();
    }

    const fingerspellMatch = normalized.match(/^FINGERSPELL\((.+)\)$/);
    if (fingerspellMatch) {
      normalized = fingerspellMatch[1].trim();
    }

    if (normalized.startsWith('X-')) {
      normalized = normalized.slice(2).trim();
    } else if (normalized.startsWith('DESC-')) {
      normalized = normalized.slice(5).trim();
    }

    return normalized;
  }, []);

  const buildBaseEntries = useCallback((tokens: string[]) => {
    const entries: PlaybackEntry[] = [];

    tokens.forEach((token, index) => {
      const normalized = normalizeSourceToken(token);
      if (!normalized) {
        return;
      }

      entries.push({
        clipToken: normalized,
        sourceIndex: index,
        sourceToken: normalized,
        displayLabel: normalized,
        isFallbackFingerspelling: false,
        letterIndex: null,
        letterTotal: null,
      });
    });

    return entries;
  }, [normalizeSourceToken]);

  const buildFingerspellingEntries = useCallback((token: string, sourceIndex: number) => {
    const normalized = normalizeSourceToken(token);
    const letters = Array.from(normalized).filter((character) => /[A-Z]/.test(character));

    return letters.map((letter, index) => ({
      clipToken: letter,
      sourceIndex,
      sourceToken: normalized,
      displayLabel: `Fingerspelling: ${normalized} (${letter})`,
      isFallbackFingerspelling: true,
      letterIndex: index,
      letterTotal: letters.length,
    }));
  }, [normalizeSourceToken]);

  const playWhenReady = useCallback((video: HTMLVideoElement) => {
    const startPlayback = () => {
      video.playbackRate = speedRef.current;
      if (isPlayingRef.current) {
        video.play().catch(() => {});
      }
    };

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      startPlayback();
      return;
    }

    const handleLoadedData = () => {
      startPlayback();
    };

    video.addEventListener('loadeddata', handleLoadedData, { once: true });
  }, []);

  const preload = useCallback((slot: 0 | 1, entryIndex: number) => {
    const nextEntry = playbackEntriesRef.current[entryIndex];
    const video = getVideo(slot);

    if (!video || !nextEntry?.clipToken) {
      setSlotEntryIndex(slot, null);
      return;
    }

    setSlotEntryIndex(slot, entryIndex);

    const nextSrc = buildVideoSrc(nextEntry.clipToken);
    if (video.getAttribute('src') === nextSrc) {
      return;
    }

    video.pause();
    video.currentTime = 0;
    video.src = nextSrc;
    video.load();
  }, [buildVideoSrc, getVideo, setSlotEntryIndex]);

  const playSlot = useCallback((slot: 0 | 1) => {
    const video = getVideo(slot);
    if (!video) {
      return;
    }

    playWhenReady(video);
  }, [getVideo, playWhenReady]);

  const notifyProgress = useCallback((entryIndex: number) => {
    const entry = playbackEntriesRef.current[entryIndex];
    if (!entry) {
      return;
    }

    if (currentSourceIndexRef.current === entry.sourceIndex) {
      return;
    }

    currentSourceIndexRef.current = entry.sourceIndex;
    onProgressRef.current?.(entry.sourceIndex, sequenceRef.current.length);
  }, []);

  const jumpToEntryIndex = useCallback((entryIndex: number) => {
    const nextEntry = playbackEntriesRef.current[entryIndex];
    if (!nextEntry) {
      return;
    }

    const slot: 0 | 1 = 0;
    const primaryVideo = videoA.current;
    const secondaryVideo = videoB.current;
    if (!primaryVideo) {
      return;
    }

    secondaryVideo?.pause();
    primaryVideo.pause();
    primaryVideo.currentTime = 0;

    activeSlotRef.current = slot;
    setSlotEntryIndex(slot, entryIndex);
    currentEntryIndexRef.current = entryIndex;
    setActiveSlot(slot);
    setCurrentEntryIndex(entryIndex);

    primaryVideo.src = buildVideoSrc(nextEntry.clipToken);
    primaryVideo.load();
    playSlot(slot);
    preload(1, entryIndex + 1);
    notifyProgress(entryIndex);
  }, [buildVideoSrc, notifyProgress, playSlot, preload, setSlotEntryIndex]);

  const jumpToSourceIndex = useCallback((sourceIndex: number) => {
    const nextEntryIndex = playbackEntriesRef.current.findIndex((entry) => entry.sourceIndex === sourceIndex);
    if (nextEntryIndex === -1) {
      return;
    }

    jumpToEntryIndex(nextEntryIndex);
  }, [jumpToEntryIndex]);

  const handleSlotError = useCallback((slot: 0 | 1) => {
    const entryIndex = getSlotEntryIndex(slot);
    if (entryIndex === null) {
      return;
    }

    const failedEntry = playbackEntriesRef.current[entryIndex];
    if (!failedEntry) {
      return;
    }

    if (!failedEntry.isFallbackFingerspelling) {
      const fallbackEntries = buildFingerspellingEntries(failedEntry.sourceToken, failedEntry.sourceIndex);
      if (fallbackEntries.length > 0) {
        const nextEntries = [
          ...playbackEntriesRef.current.slice(0, entryIndex),
          ...fallbackEntries,
          ...playbackEntriesRef.current.slice(entryIndex + 1),
        ];

        playbackEntriesRef.current = nextEntries;
        setPlaybackEntries(nextEntries);
        currentSourceIndexRef.current = null;

        if (slot === activeSlotRef.current) {
          jumpToEntryIndex(entryIndex);
        } else {
          preload(slot, entryIndex);
        }
        return;
      }
    }

    setSlotEntryIndex(slot, null);

    const nextEntryIndex = entryIndex + 1;
    if (nextEntryIndex >= playbackEntriesRef.current.length) {
      if (slot === activeSlotRef.current) {
        setCurrentEntryIndex(null);
        currentEntryIndexRef.current = null;
        onPlaybackEndRef.current?.();
      }
      return;
    }

    if (slot !== activeSlotRef.current) {
      preload(slot, nextEntryIndex);
      return;
    }

    const nextSlot: 0 | 1 = slot === 0 ? 1 : 0;
    activeSlotRef.current = nextSlot;
    currentEntryIndexRef.current = nextEntryIndex;
    setActiveSlot(nextSlot);
    setCurrentEntryIndex(nextEntryIndex);
    setSlotEntryIndex(nextSlot, nextEntryIndex);
    playSlot(nextSlot);
    preload(slot, nextEntryIndex + 1);
    notifyProgress(nextEntryIndex);
  }, [buildFingerspellingEntries, getSlotEntryIndex, jumpToEntryIndex, notifyProgress, playSlot, preload, setSlotEntryIndex]);

  const advance = useCallback(() => {
    const entryIndex = currentEntryIndexRef.current;
    const nextEntryIndex = (entryIndex ?? -1) + 1;
    const entries = playbackEntriesRef.current;

    if (nextEntryIndex >= entries.length) {
      if (isLoopingRef.current && entries.length > 0) {
        currentSourceIndexRef.current = null;
        jumpToSourceIndex(0);
        return;
      }

      setCurrentEntryIndex(null);
      currentEntryIndexRef.current = null;
      onPlaybackEndRef.current?.();
      return;
    }

    const previousSlot = activeSlotRef.current;
    const nextSlot: 0 | 1 = previousSlot === 0 ? 1 : 0;

    activeSlotRef.current = nextSlot;
    currentEntryIndexRef.current = nextEntryIndex;
    setActiveSlot(nextSlot);
    setCurrentEntryIndex(nextEntryIndex);
    setSlotEntryIndex(nextSlot, nextEntryIndex);

    const previousVideo = getVideo(previousSlot);
    if (previousVideo) {
      previousVideo.pause();
      previousVideo.currentTime = 0;
    }

    playSlot(nextSlot);
    preload(previousSlot, nextEntryIndex + 1);
    notifyProgress(nextEntryIndex);
  }, [getVideo, jumpToSourceIndex, notifyProgress, playSlot, preload, setSlotEntryIndex]);

  useEffect(() => {
    const nextEntries = buildBaseEntries(sequence);
    playbackEntriesRef.current = nextEntries;
    setPlaybackEntries(nextEntries);
    currentSourceIndexRef.current = null;
  }, [buildBaseEntries, sequence]);

  useEffect(() => {
    if (!playbackEntries.length) {
      setCurrentEntryIndex(null);
      currentEntryIndexRef.current = null;
      setSlotEntryIndex(0, null);
      setSlotEntryIndex(1, null);
      return;
    }

    jumpToSourceIndex(seekToIndex ?? 0);
  }, [jumpToSourceIndex, playbackEntries, playbackVersion, seekToIndex, setSlotEntryIndex]);

  const currentEntry = currentEntryIndex !== null ? playbackEntries[currentEntryIndex] : null;
  const isActive = currentEntryIndex !== null;
  const currentToken = currentEntry?.displayLabel ?? null;
  const currentSourceIndex = currentEntry?.sourceIndex ?? null;
  const progressPrefix = currentEntry?.isFallbackFingerspelling
    ? `${(currentEntry.letterIndex ?? 0) + 1}/${currentEntry.letterTotal ?? 0}`
    : currentSourceIndex !== null && sequence.length > 0
      ? `${currentSourceIndex + 1}/${sequence.length}`
      : null;
  const overlayMessage = currentEntry?.isFallbackFingerspelling
    ? `We do not have a direct sign clip for "${currentEntry.sourceToken}", so this word is being fingerspelled.`
    : null;

  return (
    <Paper sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3, height: '100%', ...sx }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
        sx={{ gap: 2 }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            letterSpacing: '-0.01em',
          }}
        >
          {headerControl ?? 'ASL Sign Videos'}
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

      <Box
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          bgcolor: '#dfe7f1',
          border: '1px solid',
          borderColor: 'divider',
          position: 'relative',
          height: { xs: 380, md: 430 },
          minHeight: { xs: 380, md: 430 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {!isActive && (
          <Box sx={{ textAlign: 'center', p: 3 }}>
            <PersonOutlineIcon sx={{ fontSize: 56, color: 'text.secondary' }} />
            <Typography variant="subtitle1" sx={{ mt: 1 }}>
              {sequence.length > 0 ? 'Playback complete' : 'Sign videos will appear here'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {sequence.length === 0 && 'Enter text and translate to begin'}
            </Typography>
          </Box>
        )}

        <video
          ref={videoA}
          muted
          playsInline
          preload="auto"
          onEnded={advance}
          onError={() => handleSlotError(0)}
          className={`avatar-video${isActive && activeSlot === 0 ? '' : ' avatar-video--hidden'}`}
        />

        <video
          ref={videoB}
          muted
          playsInline
          preload="auto"
          onEnded={advance}
          onError={() => handleSlotError(1)}
          className={`avatar-video${isActive && activeSlot === 1 ? '' : ' avatar-video--hidden'}`}
        />

        {currentToken && (
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
                  {currentToken}
                </span>
                {overlayMessage ? (
                  <Tooltip title={overlayMessage} arrow>
                    <InfoOutlinedIcon sx={{ fontSize: 14, pointerEvents: 'auto' }} />
                  </Tooltip>
                ) : null}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>

      {children}
    </Paper>
  );
}
