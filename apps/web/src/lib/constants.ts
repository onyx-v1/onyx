/**
 * Shared runtime constants derived from Vite environment variables.
 * Import from here — never inline these strings in component/hook files.
 */

export const API_URL: string =
  import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export const WS_URL: string =
  import.meta.env.VITE_WS_URL ?? 'http://localhost:3000';
