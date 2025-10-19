export interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 2,
  initialDelayMs: 1000,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
  retryableErrors: [
    'rate_limit',
    '429',
    '503',
    '500',
    'timeout',
    'network',
    'ECONNRESET',
    'ETIMEDOUT',
  ],
};

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  context?: string
): Promise<T> {
  let lastError: Error | null = null;
  let attempt = 0;

  while (attempt < config.maxAttempts) {
    try {
      const result = await fn();

      if (attempt > 0) {
        console.log(`[Retry Success] ${context || 'Operation'} succeeded on attempt ${attempt + 1}`);
      }

      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      attempt++;

      const isRetryable = config.retryableErrors.some((errType) =>
        lastError!.message.toLowerCase().includes(errType.toLowerCase())
      );

      if (!isRetryable || attempt >= config.maxAttempts) {
        console.error(
          `[Retry Failed] ${context || 'Operation'} failed after ${attempt} attempts:`,
          lastError
        );
        throw lastError;
      }

      const delayMs = Math.min(
        config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt - 1),
        config.maxDelayMs
      );

      console.warn(
        `[Retry] ${context || 'Operation'} failed (attempt ${attempt}/${config.maxAttempts}). Retrying in ${delayMs}ms...`,
        lastError.message
      );

      await sleep(delayMs);
    }
  }

  throw lastError || new Error('Retry failed with no error');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase();
  return DEFAULT_RETRY_CONFIG.retryableErrors.some((errType) =>
    message.includes(errType.toLowerCase())
  );
}

export async function retryOnBadJson<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 2
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      const isBadJson =
        lastError.message.includes('invalid_json') ||
        lastError.message.includes('JSON') ||
        lastError.message.includes('parse');

      if (!isBadJson || attempt >= maxAttempts - 1) {
        throw lastError;
      }

      console.warn(
        `[Bad JSON Retry] Attempt ${attempt + 1}/${maxAttempts} failed. Retrying with adjusted prompt...`
      );

      await sleep(1000);
    }
  }

  throw lastError || new Error('Retry failed');
}
