import { SequenceController } from "@hotora/core";
import type { ActionId, Fired, SequenceAction, Stage } from "@hotora/core";

import type {
  Entry,
  EventProvider,
  HotkeysEvent,
  InferElement,
  InferKey,
} from "./types";
import { DOMEventProvider } from "./eventProviders/DOMEventProvider";
import { LazyEventProvider } from "./eventProviders/LazyEventProvider";

/**
 * Default EventProvider instance.
 * Created only in browser environments (`window` exists).
 * In non-browser environments, it will be `null` and a provider must be supplied manually.
 */
const defaultProvider = new LazyEventProvider(() =>
  typeof window !== "undefined" ? new DOMEventProvider() : null,
);

/**
 * Creates a HotKeys instance using the default provider.
 * * Ideal for standard browser usage (SSR-safe). By default, it uses
 * `LazyEventProvider<DOMEventProvider>`.
 *
 * @example
 * import { createHotKeys } from "@hotora/hotkeys";
 * const hotKeys = createHotKeys();
 *
 * @returns {HotKeys<LazyEventProvider<DOMEventProvider>} A new HotKeys instance using the default provider.
 */
export function createHotKeys(): HotKeys<typeof defaultProvider>;

/**
 * Creates a HotKeys instance with a custom event provider.
 * * Use this to handle events on specific elements or non-DOM environments.
 * Types for elements and keys will be automatically inferred from the provider.
 *
 * @template {EventProvider<InferElement<TProvider>, InferKey<TProvider>>} TProvider
 * @param {TProvider} provider - A custom EventProvider instance.
 * @example
 * import { createHotKeys, EventProvider } from "@hotora/hotkeys";
 *  class CustomEventProvider implements EventProvider<any, any> {
 * // interface implementation
 * }
 * const provider = new CustomEventProvider();
 * const hotKeys = createHotKeys(provider);
 *
 * @returns {HotKeys<TProvider>} A new HotKeys instance typed according to the provided provider.
 */
export function createHotKeys<
  TProvider extends EventProvider<InferElement<TProvider>, InferKey<TProvider>>,
>(provider: TProvider): HotKeys<TProvider>;

/**
 * Factory function implementation to create a HotKeys instance.
 */
export function createHotKeys(provider?: EventProvider<any, any>) {
  return new HotKeys(provider ?? defaultProvider);
}

/**
 * HotKeys manager
 *
 * Handles keyboard shortcuts and sequences with full DOM integration.
 * Supports both browser and non-browser environments via EventProvider.
 *
 * Key features:
 * - Supports key **combinations** and **ordered sequences** (via SequenceController)
 * - **Scoped handlers**: hotkeys can be bound to specific DOM elements or named scopes
 * - **Element visibility tracking**: only visible elements are considered active
 * - **Active element resolution**:
 *    - last pointer interaction (mouse/touch)
 *    - DOM depth if multiple elements are visible
 * - **Scope chain building**: walks from element to root + global fallback
 * - **Propagation control**: handlers can stop propagation between scopes
 * - **Custom EventProvider** support for non-browser environments
 * - Automatic cleanup of disconnected DOM elements
 *
 * Environment notes:
 * - Safe for SSR use LazyProvider
 *
 * @internal
 * Prefer using `createHotKeys()` instead.
 */
export class HotKeys<
  TProvider extends EventProvider<InferElement<TProvider>, InferKey<TProvider>>,
> {
  /** Internal controller managing key sequences and combination state */
  private sequenceController = new SequenceController<
    InferKey<TProvider>,
    HotkeysEvent<InferKey<TProvider>>
  >();

  /**
   * Maps DOM elements to their scope names.
   * WeakMap is used to avoid memory leaks when elements are removed.
   */
  private elements = new WeakMap<InferElement<TProvider>, string>();

  /** Set of currently visible elements, tracked via IntersectionObserver */
  private visibleElements = new Set<InferElement<TProvider>>();

  /** Last active element determined by pointer interaction */
  private activeElement: InferElement<TProvider> | null = null;

  /** AbortController used to clean up all event subscriptions */
  private abortController = new AbortController();

  /**
   * Initializes the HotKeys manager.
   *
   * @param provider - Optional custom EventProvider.
   *                   Defaults to DOMEventProvider in browser.
   * @throws If no provider is available (non-browser environment without provider)
   */
  constructor(private provider: TProvider) {
    this.provider.onKeyDown(
      this.onKeyDown.bind(this),
      this.abortController.signal,
    );
    this.provider.onKeyUp(this.onKeyUp.bind(this), this.abortController.signal);
    this.provider.onPointer(
      this.onPointer.bind(this),
      this.abortController.signal,
    );
  }

  /**
   * Registers a hotkey or key sequence.
   *
   * @param sequence - key combination or ordered sequence
   * @param setup - handler configuration (without id and sequence)
   * @param element - optional element to bind scope to
   * @param scope - optional scope name; if element provided, scope is recommended
   * @returns action identifier
   */
  register(
    sequence: Stage<InferKey<TProvider>> | Stage<InferKey<TProvider>>[],
    setup: Omit<
      SequenceAction<InferKey<TProvider>, HotkeysEvent<InferKey<TProvider>>>,
      "id" | "sequence"
    >,
    element?: InferElement<TProvider>,
    scope?: string,
  ): ActionId {
    if (element && scope) {
      this.elements.set(element, scope);
      this.provider.observe(
        element,
        this.changeVisibility.bind(this),
        this.abortController.signal,
      );
    }

    return this.sequenceController.register(sequence, setup, scope);
  }

  /**
   * Unregisters a previously registered hotkey by its action id.
   *
   * @param id - identifier returned from `register`
   */
  unregister(id: ActionId) {
    this.sequenceController.unregister(id);
  }

  /**
   * Observer callback to track element visibility.
   *
   * Updates the `visibleElements` set and cleans up disconnected elements.
   */
  private changeVisibility(entries: Entry<InferElement<TProvider>>[]) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        this.visibleElements.add(entry.target);
      } else {
        this.visibleElements.delete(entry.target);
      }
    });
    this.cleanup();
  }

  /**
   * Pointer event handler.
   * Sets the closest registered element as the active element.
   */
  private onPointer = (target: InferElement<TProvider>) => {
    const el = this.findClosestRegistered(target);

    if (el) {
      this.activeElement = el;
    }
  };

  /**
   * Key down handler.
   * - Adds the key to the current sequence
   * - Resolves active element
   * - Walks through the scope chain
   * - Executes all matching handlers
   * - Allows stopping propagation between scopes
   */
  private onKeyDown = (key: InferKey<TProvider>) => {
    const activeEl = this.resolveActiveElement();
    const scopes = this.getScopeChain(activeEl);

    this.sequenceController.addStep(key);

    let stopPropagation = false;

    for (const scope of scopes) {
      if (stopPropagation) break;

      const fired: Fired<
        InferKey<TProvider>,
        HotkeysEvent<InferKey<TProvider>>
      > = this.sequenceController.process(scope);

      fired.forEach(([evt, handler]) => {
        handler({
          stopPropagation: () => {
            stopPropagation = true;
          },
          ...evt,
        } as HotkeysEvent<InferKey<TProvider>>);
      });
    }
  };

  /**
   * Key up handler.
   * Removes the key from the current sequence state.
   */
  private onKeyUp = (key: InferKey<TProvider>) => {
    this.sequenceController.removeStep(key);
  };

  /**
   * Resolves the currently active element.
   *
   * Priority:
   * 1. Only visible elements are considered
   * 2. If one element → return it
   * 3. If `activeElement` is still visible → return it
   * 4. Otherwise → return the deepest element in DOM
   *
   * @returns active element or null if none
   */
  private resolveActiveElement(): InferElement<TProvider> | null {
    const visible = [...this.visibleElements];

    if (visible.length === 0) return null;
    if (visible.length === 1) return visible[0] ?? null;

    if (this.activeElement && this.visibleElements.has(this.activeElement)) {
      return this.activeElement;
    }

    return visible.reduce((deepest, el) => {
      return this.getDepth(el) > this.getDepth(deepest) ? el : deepest;
    });
  }

  /**
   * Builds the scope chain for an element.
   * Walks from element up to root and always includes "$global" as fallback.
   */
  private getScopeChain(element: InferElement<TProvider> | null): string[] {
    const chain: string[] = [];
    let current: InferElement<TProvider> | null = element;

    while (current) {
      const scope = this.elements.get(current);
      if (scope) chain.push(scope);
      current = this.provider.getParentElement(current);
    }

    if (!chain.includes("$global")) {
      chain.push("$global");
    }

    return chain;
  }

  /**
   * Finds the closest ancestor element with a registered scope.
   *
   * @param el - starting element
   * @returns closest registered element or null
   */
  private findClosestRegistered(
    el: InferElement<TProvider> | null,
  ): InferElement<TProvider> | null {
    let current = el;

    while (current) {
      if (this.elements.has(current)) return current;
      current = this.provider.getParentElement(current);
    }

    return null;
  }

  /**
   * Calculates the DOM depth of an element.
   * Used to resolve the deepest visible element when multiple are present.
   *
   * @param el - element to measure
   * @returns depth (root = 1)
   */
  private getDepth(el: InferElement<TProvider>): number {
    let depth = 0;
    let current: InferElement<TProvider> | null = el;

    while (current) {
      depth++;
      current = this.provider.getParentElement(current);
    }

    return depth;
  }

  /**
   * Cleans up elements that are disposed.
   * Removes them from `visibleElements` and unobserves them.
   * Resets `activeElement` if it was removed.
   */
  private cleanup() {
    for (const el of [...this.visibleElements]) {
      if (!this.provider.getIsElementConnected(el)) {
        this.visibleElements.delete(el);
        this.provider.unobserve(el);

        if (this.activeElement === el) {
          this.activeElement = null;
        }
      }
    }
  }

  /**
   * Destroys the HotKeys instance.
   * Aborts all subscriptions and cleans up internal state.
   */
  destroy() {
    this.abortController.abort();
  }

  /**
   * Symbol-based disposal for convenience.
   * Calls `destroy`.
   */
  [Symbol.dispose]() {
    this.destroy();
  }
}
