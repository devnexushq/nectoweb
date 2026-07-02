export const DEFAULT_QUERY_TIMEOUT_MS = 8000;

export function withTimeout<T>(
  promise: PromiseLike<T>,
  timeoutMs = DEFAULT_QUERY_TIMEOUT_MS,
): Promise<T | null> {
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => resolve(null), timeoutMs);
    Promise.resolve(promise)
      .then((value) => resolve(value))
      .catch(() => resolve(null))
      .finally(() => window.clearTimeout(timer));
  });
}
