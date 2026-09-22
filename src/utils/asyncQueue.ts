/**
 * Minimal async queue: producers `push()` items as they become available,
 * a single consumer `for await`s the queue and gets them in order, blocking
 * when it's empty rather than polling. `close()` ends iteration once drained.
 */
export class AsyncQueue<T> {
  private items: T[] = [];
  private waiting: ((result: IteratorResult<T>) => void)[] = [];
  private closed = false;

  push(item: T): void {
    if (this.closed) return;
    const resolve = this.waiting.shift();
    if (resolve) resolve({ value: item, done: false });
    else this.items.push(item);
  }

  close(): void {
    this.closed = true;
    while (this.waiting.length) {
      this.waiting.shift()!({ value: undefined, done: true });
    }
  }

  async *[Symbol.asyncIterator](): AsyncGenerator<T> {
    while (true) {
      if (this.items.length > 0) {
        yield this.items.shift()!;
        continue;
      }
      if (this.closed) return;
      const result = await new Promise<IteratorResult<T>>((resolve) => this.waiting.push(resolve));
      if (result.done) return;
      yield result.value as T;
    }
  }
}
