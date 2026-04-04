export interface UnityPlaybackOptions {
  speed: number;
  loop: boolean;
}

export interface UnityPlaybackState {
  currentSeconds: number;
  totalSeconds: number;
  isPlaying: boolean;
  currentToken: string;
  currentTokenIndex: number;
  totalTokens: number;
}

type UnityInstance = {
  SendMessage: (objectName: string, methodName: string, parameter?: string) => void;
};

declare global {
  interface Window {
    __unityPlaybackListener?: (state: UnityPlaybackState) => void;
    unityInstance?: UnityInstance;
    __pendingUnityPayload?: string;
    handleUnityPlaybackState?: (
      currentSeconds: number,
      totalSeconds: number,
      isPlaying: number,
      currentToken: string,
      currentTokenIndex: number,
      totalTokens: number,
    ) => void;
  }
}

if (typeof window !== 'undefined') {
  window.handleUnityPlaybackState = (
    currentSeconds: number,
    totalSeconds: number,
    isPlaying: number,
    currentToken: string,
    currentTokenIndex: number,
    totalTokens: number,
  ) => {
    window.__unityPlaybackListener?.({
      currentSeconds,
      totalSeconds,
      isPlaying: Boolean(isPlaying),
      currentToken,
      currentTokenIndex,
      totalTokens,
    });
  };
}

function sendUnityMessage(methodName: string, parameter?: string): boolean {
  if (!window.unityInstance) {
    return false;
  }

  window.unityInstance.SendMessage('ASLBridge', methodName, parameter ?? '');
  return true;
}

export function sendSignSequenceToUnity(
  sequence: string[],
  options: UnityPlaybackOptions,
): void {
  const payload = JSON.stringify({ sequence, options });

  if (!window.unityInstance) {
    window.__pendingUnityPayload = payload;
    console.warn('Unity not ready yet; payload queued.');
    return;
  }

  console.log('Sending to Unity:', payload);
  sendUnityMessage('PlaySequence', payload);
}

export function flushPendingUnityPayload(): void {
  if (!window.unityInstance || !window.__pendingUnityPayload) return;

  console.log('Flushing queued Unity payload');
  sendUnityMessage('PlaySequence', window.__pendingUnityPayload);
  window.__pendingUnityPayload = undefined;
}

export function pauseUnityPlayback(): void {
  sendUnityMessage('PausePlayback');
}

export function resumeUnityPlayback(): void {
  sendUnityMessage('ResumePlayback');
}

export function setUnityPlaybackLoop(loop: boolean): void {
  sendUnityMessage('SetLooping', String(loop));
}

export function setUnityPlaybackSpeed(speed: number): void {
  sendUnityMessage('SetPlaybackSpeed', String(speed));
}

export function resetUnityToIdle(): void {
  sendUnityMessage('ResetToIdle');
}

export function setUnityPlaybackStateListener(
  listener?: (state: UnityPlaybackState) => void,
): void {
  window.__unityPlaybackListener = listener;
}
