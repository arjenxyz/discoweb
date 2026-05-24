/** Metinde @everyone geçiyor mu? */
export function textMentionsEveryone(text: string): boolean {
  return /@everyone\b/i.test(text);
}

export function announcementMentionsEveryone(title: string, body: string): boolean {
  return textMentionsEveryone(title) || textMentionsEveryone(body);
}
