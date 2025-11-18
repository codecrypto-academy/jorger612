export function extractErrorMessage(error: unknown): string {
  if (!error) return "Error desconocido";

  if (typeof error === "string") return error;

  if (error instanceof Error) {
    const message = error.message || error.toString();
    const match = message.match(/execution reverted (?:with reason string )?"?([^"]+)"?/i);
    if (match?.[1]) {
      return match[1];
    }
    return message;
  }

  if (typeof error === "object" && "message" in (error as Record<string, unknown>)) {
    return String((error as Record<string, unknown>).message);
  }

  return "Error desconocido";
}

