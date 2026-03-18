import { TranslateResponse } from '../types/translate';

const isValidResponse = (data: TranslateResponse): boolean => {
  return (
    typeof data?.originalText === 'string' &&
    Array.isArray(data?.aslGloss) &&
    data.aslGloss.every((item) => typeof item === 'string') &&
    Array.isArray(data?.notes) &&
    Array.isArray(data?.unknownTokens)
  );
};

export async function translateEnglishToASL(input: string): Promise<TranslateResponse> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: input }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error('Translation service responded with an error.');
    }

    const data = (await response.json()) as TranslateResponse;
    if (!isValidResponse(data)) {
      throw new Error('Translation service returned an invalid payload.');
    }

    return data;
  } catch (error) {
    const isNetworkError = error instanceof TypeError;
    const isAbort = error instanceof DOMException && error.name === 'AbortError';

    if (!isNetworkError && !isAbort) {
      throw error;
    }

    // Safe fallback when the backend is unreachable during local development.
    // NOTE: This is a frontend-only fallback for when the server is not running.
    // For a richer offline demo, start the backend – it has its own mock mode.
    return {
      originalText: input,
      aslGloss: ['ME', 'GO', 'STORE', 'TOMORROW'],
      notes: ['Frontend fallback – backend unreachable. Start the backend server for real responses.'],
      unknownTokens: [],
    };
  } finally {
    window.clearTimeout(timeoutId);
  }
}
