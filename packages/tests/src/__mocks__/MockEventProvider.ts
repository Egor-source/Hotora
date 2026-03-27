import type {
  Entry,
  EventProvider,
  InputHandler,
  ObserveHandler,
  PointerHandler,
} from "@hotora/inputs";
import { Keys } from "@hotora/inputs";

export class MockEventProvider implements EventProvider<{}, Keys> {
  private inputStartHandlers = new Set<InputHandler<Keys>>();
  private inputEndHandlers = new Set<InputHandler<Keys>>();
  private pointerHandlers = new Set<PointerHandler<{}>>();
  private observeHandlers = new Set<ObserveHandler<{}>>();
  private elementsObserveHandlers = new Map<{}, ObserveHandler<{}>>();

  onInputStart(handler: InputHandler<Keys>, signal: AbortSignal) {
    this.inputStartHandlers.add(handler);
    signal?.addEventListener("abort", () =>
      this.inputStartHandlers.delete(handler),
    );
  }

  onInputEnd(handler: InputHandler<Keys>, signal: AbortSignal) {
    this.inputEndHandlers.add(handler);
    signal?.addEventListener("abort", () =>
      this.inputEndHandlers.delete(handler),
    );
  }

  onPointer(handler: PointerHandler<unknown>, signal: AbortSignal) {
    this.pointerHandlers.add(handler);
    signal?.addEventListener("abort", () =>
      this.pointerHandlers.delete(handler),
    );
  }

  observe(element: {}, handler: ObserveHandler<{}>, signal: AbortSignal) {
    this.observeHandlers.add(handler);
    this.elementsObserveHandlers.set(element, handler);
    signal?.addEventListener("abort", () => {
      this.observeHandlers.delete(handler);
      this.elementsObserveHandlers.delete(element);
    });
  }

  unobserve(element: {}) {
    const handler = this.elementsObserveHandlers.get(element);
    if (handler) {
      this.observeHandlers.delete(handler);
      this.elementsObserveHandlers.delete(element);
    }
  }

  emitInputStart(code: Keys) {
    for (const handler of this.inputStartHandlers) handler(code);
  }

  emitInputEnd(code: Keys) {
    for (const handler of this.inputEndHandlers) handler(code);
  }

  emitPointer(target: unknown) {
    for (const handler of this.pointerHandlers) handler(target);
  }

  emitObserve(entries: Entry<unknown>[]) {
    for (const handler of this.observeHandlers) handler(entries);
  }

  getParentElement(element: unknown): unknown | null {
    return element.parentElement;
  }

  getIsElementConnected(element: unknown): boolean {
    return element.isConnected;
  }
}
