mergeInto(LibraryManager.library, {
  ReportPlaybackState: function (currentSeconds, totalSeconds, isPlaying, currentTokenPtr, currentTokenIndex, totalTokens) {
    if (typeof window !== 'undefined' && typeof window.handleUnityPlaybackState === 'function') {
      var currentToken = currentTokenPtr ? UTF8ToString(currentTokenPtr) : '';
      window.handleUnityPlaybackState(
        currentSeconds,
        totalSeconds,
        isPlaying,
        currentToken,
        currentTokenIndex,
        totalTokens
      );
    }
  },
});
