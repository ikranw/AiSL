mergeInto(LibraryManager.library, {
  ReportPlaybackState: function (currentSeconds, totalSeconds, isPlaying) {
    if (typeof window !== 'undefined' && typeof window.handleUnityPlaybackState === 'function') {
      window.handleUnityPlaybackState(currentSeconds, totalSeconds, isPlaying);
    }
  },
});
