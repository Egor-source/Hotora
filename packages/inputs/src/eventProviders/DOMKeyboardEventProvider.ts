import type {
  Entry,
  EventProvider,
  InputHandler,
  Keys,
  ObserveHandler,
  PointerHandler,
} from "../types";

/**
 * DOMKeyboardEventProvider
 *
 * Default browser-based implementation of EventProvider.
 *
 * Provides keyboard, pointer and visibility (intersection) events
 * using native DOM APIs:
 * - `keydown` / `keyup`
 * - `mousedown` / `touchstart`
 * - `IntersectionObserver`
 *
 * Key features:
 * - Global keyboard event handling (via `document`)
 * - Pointer-based element targeting (mouse / touch)
 * - Element visibility tracking via IntersectionObserver
 * - Automatic subscription cleanup via AbortSignal
 *
 * How it works:
 * - Subscribes to global DOM events on construction
 * - Stores handlers in internal Sets
 * - Dispatches events to all active handlers
 * - Uses IntersectionObserver to track element visibility
 *
 * Event model:
 * - `onKeyDown` fires only once per key press (ignores repeat)
 * - `onKeyUp` fires on key release
 * - `onPointer` fires on mouse/touch interaction with target element
 * - `observe` tracks visibility changes for elements
 *
 * Memory safety:
 * - Uses `WeakMap` for element-handler mapping (no leaks)
 * - Uses `AbortSignal` to automatically remove handlers
 *
 * Limitations:
 * - Requires browser environment (`document`, `IntersectionObserver`)
 * - Not safe for SSR (use LazyEventProvider or custom provider)
 *
 * Usage:
 * ```ts
 * const provider = new DOMKeyboardEventProvider();
 * ```
 */
export class DOMKeyboardEventProvider implements EventProvider<
  HTMLElement,
  Keys
> {
  /** Registered keydown handlers */
  private keyDownHandlers = new Set<InputHandler<Keys>>();

  /** Registered keyup handlers */
  private keyUpHandlers = new Set<InputHandler<Keys>>();

  /** Registered pointer handlers (mouse / touch) */
  private pointerHandlers = new Set<PointerHandler<HTMLElement>>();

  /** Registered visibility handlers */
  private observeHandlers = new Set<ObserveHandler<HTMLElement>>();

  /** Maps elements to their observe handlers */
  private elementsObserveHandlers = new WeakMap<
    HTMLElement,
    ObserveHandler<HTMLElement>
  >();

  /**
   * IntersectionObserver instance for tracking element visibility.
   * Dispatches simplified entries to all registered observe handlers.
   */
  private observer = new IntersectionObserver((entries) => {
    const filteredEntries = entries.map(({ target, isIntersecting }) => ({
      target,
      isIntersecting,
    })) as Entry<HTMLElement>[];

    for (const handler of this.observeHandlers) {
      handler(filteredEntries);
    }
  });

  /**
   * Initializes global DOM listeners.
   *
   * Subscribes to:
   * - keydown (ignores repeat)
   * - keyup
   * - mousedown / touchstart (pointer detection)
   */
  constructor() {
    document.addEventListener("keydown", ({ code, repeat }) => {
      if (repeat) return;

      for (const handler of this.keyDownHandlers) {
        handler(code as Keys);
      }
    });

    document.addEventListener("keyup", ({ code }) => {
      for (const handler of this.keyUpHandlers) {
        handler(code as Keys);
      }
    });

    const onPointer = ({ target }: Event) => {
      for (const handler of this.pointerHandlers) {
        handler(target as HTMLElement);
      }
    };

    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
  }

  /**
   * Starts observing element visibility.
   *
   * - Registers handler
   * - Subscribes element to IntersectionObserver
   * - Automatically cleans up on AbortSignal
   */
  observe(
    element: HTMLElement,
    handler: ObserveHandler<HTMLElement>,
    signal: AbortSignal,
  ): void {
    this.observer.observe(element);
    this.observeHandlers.add(handler);
    this.elementsObserveHandlers.set(element, handler);

    signal.addEventListener("abort", () => {
      this.observeHandlers.delete(handler);
      this.elementsObserveHandlers.delete(element);
      this.observer.unobserve(element);
    });
  }

  /**
   * Stops observing element visibility.
   *
   * - Unsubscribes from IntersectionObserver
   * - Removes associated handler
   */
  unobserve(element: HTMLElement) {
    this.observer.unobserve(element);

    const handler = this.elementsObserveHandlers.get(element);
    if (handler) {
      this.observeHandlers.delete(handler);
      this.elementsObserveHandlers.delete(element);
    }
  }

  /**
   * Subscribes to keydown events.
   *
   * - Ignores repeated key presses
   * - Automatically unsubscribes on AbortSignal
   */
  onInputStart(handler: InputHandler<Keys>, signal: AbortSignal): void {
    this.keyDownHandlers.add(handler);

    signal.addEventListener("abort", () => {
      this.keyDownHandlers.delete(handler);
    });
  }

  /**
   * Subscribes to keyup events.
   *
   * Automatically unsubscribes on AbortSignal.
   */
  onInputEnd(handler: InputHandler<Keys>, signal: AbortSignal): void {
    this.keyUpHandlers.add(handler);

    signal.addEventListener("abort", () => {
      this.keyUpHandlers.delete(handler);
    });
  }

  /**
   * Subscribes to pointer events (mouse / touch).
   *
   * Fires when user interacts with any element.
   * Provides event target as argument.
   *
   * Automatically unsubscribes on AbortSignal.
   */
  onPointer(handler: PointerHandler<HTMLElement>, signal: AbortSignal): void {
    this.pointerHandlers.add(handler);

    signal.addEventListener("abort", () => {
      this.pointerHandlers.delete(handler);
    });
  }

  /**
   * Returns parent element from DOM.
   */
  getParentElement(element: HTMLElement): HTMLElement | null {
    return element.parentElement;
  }

  /**
   * Checks whether element is connected to the DOM.
   */
  getIsElementConnected(element: HTMLElement): boolean {
    return element.isConnected;
  }
}
