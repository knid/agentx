import { spinner } from '@clack/prompts';

export function createSpinner() {
  const s = spinner();
  return {
    start(message: string) {
      s.start(message);
    },
    stop(message: string) {
      s.stop(message);
    },
    message(message: string) {
      s.message(message);
    },
  };
}
