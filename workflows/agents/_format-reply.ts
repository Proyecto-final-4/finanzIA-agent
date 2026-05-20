/**
 * Extracts reply text from a sub-agent's last message.
 *
 * Last message content may be one of:
 *   1. string — plain text reply
 *   2. ContentBlock[] — multi-modal blocks (OpenAI/Anthropic format)
 *   3. null / undefined — agent returned no content
 *
 * @param messages        Sub-agent result message array.
 * @param defaultMessage  Text when the array is empty.
 * @param nullFallback    Value to serialize when content is null/undefined.
 *                        Useful to pass the full `result` object as fallback.
 */
export function formatAgentReply(
  messages: { content: unknown }[],
  defaultMessage = "Sub-agent returned no response.",
  nullFallback?: unknown,
): string {
  const last = messages.at(-1);
  if (!last) return defaultMessage;

  const { content } = last;

  if (typeof content === "string") return content;

  if (Array.isArray(content)) {
    return content
      .map((block) => {
        if (typeof block === "string") return block;
        if (block && typeof block === "object" && "text" in block) {
          return String((block as { text: unknown }).text);
        }
        return JSON.stringify(block);
      })
      .join("\n");
  }

  return JSON.stringify(
    nullFallback !== undefined ? (content ?? nullFallback) : content,
  );
}
