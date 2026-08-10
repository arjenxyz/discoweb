import DOMPurify from 'dompurify';

export const sanitizeHtml = (input: string) => {
  if (typeof window === 'undefined') {
    return input;
  }
  return DOMPurify.sanitize(input, { USE_PROFILES: { html: true } });
};
