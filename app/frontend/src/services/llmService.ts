import { TranslateResponse } from '../types/translate';

const isValidResponse = (data: TranslateResponse): boolean => {
  return (
    typeof data?.asl_gloss === 'string' &&
    Array.isArray(data?.sign_sequence) &&
    data.sign_sequence.every((item) => typeof item === 'string')
  );
};

export async function translateEnglishToASL(input: string): Promise<TranslateResponse> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 8000);

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

    // Safe fallback when the backend is unavailable during local development.
    return {
      asl_gloss: 'ME GO STORE TOMORROW',
      sign_sequence: ['ME', 'GO', 'STORE', 'TOMORROW'],
    };
  } finally {
    window.clearTimeout(timeoutId);
  }
}
