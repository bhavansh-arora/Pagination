/**
 * Buffers streamed LLM text tokens and releases complete chunks (sentence or
 * clause boundaries) so TTS can start speaking before the full reply is ready.
 */
export class SentenceSplitter {
  private buffer = "";

  /** Feed a text delta in; returns any chunks now ready to speak. */
  push(delta: string): string[] {
    this.buffer += delta;
    const ready: string[] = [];

    // Split on sentence-ending punctuation (including Hindi's danda ।/॥),
    // or a comma once the buffer is long enough that waiting for a full
    // sentence would add noticeable delay.
    let match: RegExpMatchArray | null;
    const boundary = /[.!?।॥]+[\s"')\]]*|,\s+(?=.{20,})/;
    while ((match = this.buffer.match(boundary))) {
      const cutIndex = match.index! + match[0].length;
      const chunk = this.buffer.slice(0, cutIndex).trim();
      this.buffer = this.buffer.slice(cutIndex);
      if (chunk) ready.push(chunk);
    }
    return ready;
  }

  /** Call when the LLM stream ends; returns any trailing text. */
  flush(): string | null {
    const rest = this.buffer.trim();
    this.buffer = "";
    return rest.length ? rest : null;
  }

  reset(): void {
    this.buffer = "";
  }
}
