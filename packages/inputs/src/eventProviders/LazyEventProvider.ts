import type {
  EventProvider,
  InputHandler,
  PointerHandler,
  ObserveHandler,
  InferElement,
  InferStep,
} from "../types";

/**
 * LazyEventProvider
 *
 * A deferred (lazy) implementation of EventProvider that allows safe usage in:
 * - SSR environments (no `window` / DOM available)
 * - async/dynamic provider loading (e.g. via import())
 * - plugin-based architectures where provider may appear later
 *
 * How it works:
 * - All subscription methods (`onInputStart`, `onInputEnd`, `onPointer`, `observe`)
 *   are buffered until the real provider is available.
 * - Once the provider is resolved (sync or async), all buffered subscriptions
 *   are replayed in order.
 * - After initialization, all calls are delegated directly to the real provider.
 *
 * Lifecycle:
 * 1. Instance created with a `factory`
 * 2. First subscription triggers `init()`
 * 3. Provider is resolved (sync or async)
 * 4. Buffered handlers are attached
 * 5. Further calls go directly to provider
 *
 * Important:
 * - If factory returns `null`, provider is considered unavailable (SSR mode)
 * - In this case:
 *   - subscriptions are ignored after init
 *   - DOM-related methods throw when accessed after initialization
 *
 * Guarantees:
 * - No ReferenceError in SSR (no direct DOM access)
 * - Safe to call before provider exists
 * - Handlers are not lost during async initialization
 *
 * Limitations:
 * - DOM-dependent methods (`getParentElement`, `getIsElementConnected`)
 *   return fallback values before initialization
 * - If provider resolves to null, these methods will throw after init
 *
 * @typeParam TElement - element type (e.g. HTMLElement or custom)
 * @typeParam TStep - step type (e.g. Keys enum)
 */
export class LazyEventProvider<
  TProvider extends EventProvider<
    InferElement<TProvider>,
    InferStep<TProvider>
  >,
> implements EventProvider<InferElement<TProvider>, InferStep<TProvider>> {
  /** Resolved real provider (or null if unavailable) */
  private provider: TProvider | null = null;

  /** Buffered inputStart subscriptions */
  private inputStartHandlers: Array<
    [InputHandler<InferStep<TProvider>>, AbortSignal]
  > = [];

  /** Buffered inputEnd subscriptions */
  private inputEndHandlers: Array<
    [InputHandler<InferStep<TProvider>>, AbortSignal]
  > = [];

  /** Buffered pointer subscriptions */
  private pointerHandlers: Array<
    [PointerHandler<InferElement<TProvider>>, AbortSignal]
  > = [];

  /** Buffered observe subscriptions */
  private observeHandlers: Array<
    [
      InferElement<TProvider>,
      ObserveHandler<InferElement<TProvider>>,
      AbortSignal,
    ]
  > = [];

  /** Tracks async initialization state */
  private initializing: Promise<void> | null = null;

  /** Indicates that factory has been executed and provider resolved */
  isReady = false;

  /**
   * @param factory Function that returns:
   * - EventProvider (sync)
   * - Promise<EventProvider> (async)
   * - null (SSR / unavailable environment)
   */
  constructor(private factory: () => TProvider | Promise<TProvider> | null) {}

  /**
   * Initializes the provider (once).
   * Resolves factory and replays all buffered subscriptions.
   */
  private init() {
    if (this.isReady || this.initializing) return;

    this.initializing = (async () => {
      const p = this.factory();
      this.provider = p instanceof Promise ? await p : p;

      this.isReady = true;
      this.initializing = null;

      if (!this.provider) return;

      this.inputStartHandlers.forEach(([h, s]) =>
        this.provider!.onInputStart(h, s),
      );
      this.inputEndHandlers.forEach(([h, s]) =>
        this.provider!.onInputEnd(h, s),
      );
      this.pointerHandlers.forEach(([h, s]) => this.provider!.onPointer(h, s));
      this.observeHandlers.forEach(([el, cb, s]) =>
        this.provider!.observe(el, cb, s),
      );

      this.inputStartHandlers = [];
      this.inputEndHandlers = [];
      this.pointerHandlers = [];
      this.observeHandlers = [];
    })();
  }

  /**
   * Reinitialize the provider.
   */
  reinitialize() {
    this.isReady = false;
    this.provider = null;
    this.init();
  }

  /**
   * Subscribes to inputStart events.
   * Buffered until provider is ready.
   */
  onInputStart(
    handler: InputHandler<InferStep<TProvider>>,
    signal: AbortSignal,
  ) {
    if (this.isReady) {
      this.assertProvider();
      this.provider!.onInputStart(handler, signal);
    } else {
      this.inputStartHandlers.push([handler, signal]);
      this.init();
    }
  }

  /**
   * Subscribes to inputEnd events.
   * Buffered until provider is ready.
   */
  onInputEnd(handler: InputHandler<InferStep<TProvider>>, signal: AbortSignal) {
    if (this.isReady) {
      this.assertProvider();
      this.provider!.onInputEnd(handler, signal);
    } else {
      this.inputEndHandlers.push([handler, signal]);
      this.init();
    }
  }

  /**
   * Subscribes to pointer events.
   * Buffered until provider is ready.
   */
  onPointer(
    handler: PointerHandler<InferElement<TProvider>>,
    signal: AbortSignal,
  ) {
    if (this.isReady) {
      this.assertProvider();
      this.provider!.onPointer(handler, signal);
    } else {
      this.pointerHandlers.push([handler, signal]);
      this.init();
    }
  }

  /**
   * Starts observing an element.
   * Buffered if provider is not ready yet.
   */
  observe(
    element: InferElement<TProvider>,
    callback: ObserveHandler<InferElement<TProvider>>,
    signal: AbortSignal,
  ) {
    this.assertProvider();

    if (this.isReady) {
      this.provider!.observe(element, callback, signal);
    } else {
      this.observeHandlers.push([element, callback, signal]);
    }
  }

  /**
   * Stops observing an element.
   * If not initialized, removes from buffer.
   */
  unobserve(element: InferElement<TProvider>) {
    this.assertProvider();

    if (this.isReady) {
      this.provider?.unobserve(element);
    } else {
      this.observeHandlers = this.observeHandlers.filter(
        (el) => el[0] !== element,
      );
    }
  }

  /**
   * Returns parent element using provider.
   * Before initialization returns null.
   */
  getParentElement(element: InferElement<TProvider>) {
    this.assertProvider();
    return this.provider?.getParentElement(element) || null;
  }

  /**
   * Returns whether element is connected to DOM.
   * Before initialization returns true (safe fallback).
   */
  getIsElementConnected(element: InferElement<TProvider>): boolean {
    this.assertProvider();
    return this.provider?.getIsElementConnected(element) || true;
  }

  /**
   * Ensures provider is valid after initialization.
   * Throws if factory resolved to null.
   */
  private assertProvider() {
    if (this.isReady && !this.provider) {
      throw new Error("Provider initialized but not available");
    }
  }
}
