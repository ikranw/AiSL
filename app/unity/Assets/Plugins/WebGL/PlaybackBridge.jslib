mergeInto(LibraryManager.library, {
  ReportPlaybackState: function (
    currentSeconds,
    totalSeconds,
    isPlaying,
    currentTokenPtr,
    currentTokenIndex,
    totalTokens,
    isFingerspelling,
    displayTokenPtr,
    displayIndex,
    displayTotal
  ) {
    if (typeof window !== 'undefined' && typeof window.handleUnityPlaybackState === 'function') {
      var currentToken = currentTokenPtr ? UTF8ToString(currentTokenPtr) : '';
      var displayToken = displayTokenPtr ? UTF8ToString(displayTokenPtr) : '';
      window.handleUnityPlaybackState(
        currentSeconds,
        totalSeconds,
        isPlaying,
        currentToken,
        currentTokenIndex,
        totalTokens,
        isFingerspelling,
        displayToken,
        displayIndex,
        displayTotal
      );
    }
  },
});
