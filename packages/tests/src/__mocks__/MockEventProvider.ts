import type {
  EventProvider,
  KeyHandler,
  Keys,
  ObserveHandler,
  PointerHandler,
  Entry,
} from "@hotora/hotkeys";
import { Keys } from "@hotora/hotkeys";

export class MockEventProvider implements EventProvider<{}, Keys> {
  private keyDownHandlers = new Set<KeyHandler<Keys>>();
  private keyUpHandlers = new Set<KeyHandler<Keys>>();
  private pointerHandlers = new Set<PointerHandler<{}>>();
  private observeHandlers = new Set<ObserveHandler<{}>>();
  private elementsObserveHandlers = new Map<{}, ObserveHandler<{}>>();

  onKeyDown(handler: KeyHandler<Keys>, signal: AbortSignal) {
    this.keyDownHandlers.add(handler);
    signal?.addEventListener("abort", () =>
      this.keyDownHandlers.delete(handler),
    );
  }

  onKeyUp(handler: KeyHandler<Keys>, signal: AbortSignal) {
    this.keyUpHandlers.add(handler);
    signal?.addEventListener("abort", () => this.keyUpHandlers.delete(handler));
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

  emitKeyDown(code: Keys) {
    for (const handler of this.keyDownHandlers) handler(code);
  }

  emitKeyUp(code: Keys) {
    for (const handler of this.keyUpHandlers) handler(code);
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
