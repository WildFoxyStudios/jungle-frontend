/**
 * Wraps a fire-and-forget async call with error logging and optional retry.
 *
 * @param fn  - Async function to execute
 * @param label - Label for logging (e.g. function name)
 * @param retries - Number of retries (default 2)
 */
export function safeFireAndForget(
  fn: () => Promise<unknown>,
  label: string,
  retries = 2,
): void {
  const attempt = (remaining: number, delay: number) => {
    fn().catch((err: unknown) => {
      if (remaining > 0) {
        setTimeout(() => attempt(remaining - 1, delay * 2), delay);
      } else {
        console.error(`[${label}] fire-and-forget failed after retries:`, err);
      }
    });
  };
  attempt(retries, 500);
}
