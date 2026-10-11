// Shared limits for the chat. They match the database rules
// (messages.content <= 100000 characters, conversations.title 1..200).
export const MAX_USER_MESSAGE_CHARS = 20_000;
export const MAX_HISTORY_MESSAGES = 20;
export const MAX_HISTORY_CHARS = 60_000;

export function makeTitle(text: string): string {
  const oneLine = text.replace(/\s+/g, " ").trim();
  if (!oneLine) return "New chat";
  return oneLine.length > 60 ? `${oneLine.slice(0, 57)}...` : oneLine;
}
