export interface UnityPlaybackOptions {
  speed: number;
  loop: boolean;
}

type UnityInstance = {
  SendMessage: (objectName: string, methodName: string, parameter?: string) => void;
};

declare global {
  interface Window {
    unityInstance?: UnityInstance;
    __pendingUnityPayload?: string;
  }
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
