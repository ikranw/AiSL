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
  window.unityInstance.SendMessage('ASLBridge', 'PlaySequence', payload);
}

export function flushPendingUnityPayload(): void {
  if (!window.unityInstance || !window.__pendingUnityPayload) return;

  console.log('Flushing queued Unity payload');
  window.unityInstance.SendMessage(
    'ASLBridge',
    'PlaySequence',
    window.__pendingUnityPayload,
  );
  window.__pendingUnityPayload = undefined;
}