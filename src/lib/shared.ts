// A link shared to Happy Orange from another app (YouTube, Instagram, LinkedIn, a browser…), founder 22 Oct 2026.
// The share menu hands over the address and, on iPhone, often the page title; the title waits here until Myra
// reads the link on the Learning card.
let titles: Record<string, string> = {};
export const rememberSharedTitle = (url: string, title?: string | null) => { if (title) titles = { [url]: title }; };
export const sharedTitleFor = (url: string) => titles[url];

/** The first web address in shared text, e.g. "Watch this: https://youtu.be/abc" → "https://youtu.be/abc". */
export function firstUrl(text?: string | null): string | null {
  const m = (text ?? '').match(/https?:\/\/[^\s<>"']+/i);
  return m ? m[0].replace(/[).,;!?]+$/, '') : null;
}
