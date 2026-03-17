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
  }
}

export function sendSignSequenceToUnity(
  sequence: string[],
  options: UnityPlaybackOptions,
): void {
  // Unity WebGL will attach an instance to window.unityInstance at runtime.
  if (!window.unityInstance) {
    return;
  }

  const payload = JSON.stringify({ sequence, options });
  window.unityInstance.SendMessage('ASLBridge', 'PlaySequence', payload);
}
