/**
 * Format agent output based on the requested format.
 */
export function formatOutput(data: string, format: 'text' | 'json'): string {
  if (format === 'json') {
    try {
      // If the data is already valid JSON, pretty-print it
      const parsed = JSON.parse(data);
      return JSON.stringify(parsed, null, 2);
    } catch {
      // Wrap plain text in a JSON object
      return JSON.stringify({ output: data });
    }
  }

  return data;
}
