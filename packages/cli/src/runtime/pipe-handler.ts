/**
 * Detect whether stdin has piped input (not a TTY).
 */
export async function detectPipedInput(): Promise<boolean> {
  return !process.stdin.isTTY;
}

/**
 * Read all piped input from stdin.
 */
export async function readPipedInput(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}

/**
 * Build the final prompt by prepending piped content.
 * If pipedContent is empty, returns the prompt unchanged.
 */
export function buildPromptWithPipe(prompt: string, pipedContent: string): string {
  if (!pipedContent) {
    return prompt;
  }

  if (!prompt) {
    return pipedContent;
  }

  return `${pipedContent}\n\n${prompt}`;
}
