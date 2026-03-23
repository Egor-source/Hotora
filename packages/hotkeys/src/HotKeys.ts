import { SequenceController } from "@hotora/core";
import type { ActionId, Fired, SequenceAction, Stage } from "@hotora/core";

import type { HotkeysEvent, Keys } from "./types";

/**
 * HotKeys manager that supports:
 * - key combinations and sequences (via SequenceController)
 * - scoped handlers (scopes)
 * - binding to DOM elements
 *
 * Features:
 * - processes only visible elements (via IntersectionObserver)
 * - resolves "active" element based on:
 *   - last pointer interaction (mouse/touch)
 *   - DOM depth (if multiple elements are visible)
 * - builds scope chain (from element up to root + $global fallback)
 * - allows stopping propagation between scopes
 */
class HotKeys {
  /** Internal controller for key sequences */
  private sequenceController = new SequenceController<Keys, HotkeysEvent>();

  /**
   * Maps DOM elements to their scope
   * WeakMap is used to avoid memory leaks
   */
  private elements = new WeakMap<HTMLElement, string>();

  /** Set of currently visible elements (tracked by IntersectionObserver) */
  private visibleElements = new Set<HTMLElement>();

  /** Last active element determined by pointer interaction */
  private activeElement: HTMLElement | null = null;

  /**
   * Observer that tracks element visibility
   * Adds/removes elements from visibleElements
   */
  private observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const el = entry.target as HTMLElement;

      if (entry.isIntersecting) {
        this.visibleElements.add(el);
      } else {
        this.visibleElements.delete(el);
      }
    }
    this.cleanup();
  });

  /** Subscribes to global keyboard and pointer events */
  constructor() {
    document.addEventListener("keydown", this.onKeyDown.bind(this));
    document.addEventListener("keyup", this.onKeyUp.bind(this));
    document.addEventListener("mousedown", this.onPointer.bind(this));
    document.addEventListener("touchstart", this.onPointer.bind(this));
  }

  /**
   * Registers a hotkey or key sequence
   *
   * @param sequence - key combination or sequence
   * @param setup - handler configuration (without id and sequence)
   * @param element - optional DOM element to bind scope to
   * @param scope - optional scope name
   *
   * @returns action identifier
   */
  register(
    sequence: Stage<Keys> | Stage<Keys>[],
    setup: Omit<SequenceAction<Keys, HotkeysEvent>, "id" | "sequence">,
    element?: HTMLElement,
    scope?: string,
  ): ActionId {
    if (element && scope) {
      this.elements.set(element, scope);
      this.observer.observe(element);
    }

    return this.sequenceController.register(sequence, setup, scope);
  }

  /**
   * Unregisters a previously registered hotkey
   *
   * @param id - action identifier
   */
  unregister(id: ActionId) {
    this.sequenceController.unregister(id);
  }

  /**
   * Pointer event handler
   * Stores the closest registered element as active
   */
  private onPointer = (e: Event) => {
    const target = e.target as HTMLElement;
    const el = this.findClosestRegistered(target);

    if (el) {
      this.activeElement = el;
    }
  };

  /**
   * Key down handler
   * - adds step to sequence
   * - resolves active element
   * - walks through scope chain
   * - executes matched handlers
   */
  private onKeyDown = (event: KeyboardEvent) => {
    if (event.repeat) return;

    const step = event.code as Keys;
    const activeEl = this.resolveActiveElement();
    const scopes = this.getScopeChain(activeEl);

    this.sequenceController.addStep(step);

    let stopPropagation = false;

    for (const scope of scopes) {
      if (stopPropagation) break;

      const fired: Fired<Keys, HotkeysEvent> =
        this.sequenceController.process(scope);

      fired.forEach(([evt, handler]) => {
        handler({
          stopPropagation: () => {
            stopPropagation = true;
          },
          ...evt,
        } as HotkeysEvent);
      });
    }
  };

  /**
   * Key up handler
   * Removes step from current sequence state
   */
  private onKeyUp = (event: KeyboardEvent) => {
    const step = event.code as Keys;
    this.sequenceController.removeStep(step);
  };

  /**
   * Resolves the currently active element
   *
   * Priority:
   * 1. Only visible elements are considered
   * 2. If one element → return it
   * 3. If activeElement is still visible → return it
   * 4. Otherwise → return the deepest element in DOM
   */
  private resolveActiveElement(): HTMLElement | null {
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
   * Builds scope chain from element to root
   * Always includes "$global" as fallback
   */
  private getScopeChain(element: HTMLElement | null): string[] {
    const chain: string[] = [];
    let current: HTMLElement | null = element;

    while (current) {
      const scope = this.elements.get(current);
      if (scope) chain.push(scope);
      current = current.parentElement;
    }

    if (!chain.includes("$global")) {
      chain.push("$global");
    }

    return chain;
  }

  /**
   * Finds the closest ancestor element that has a registered scope
   */
  private findClosestRegistered(el: HTMLElement | null): HTMLElement | null {
    let current = el;

    while (current) {
      if (this.elements.has(current)) return current;
      current = current.parentElement;
    }

    return null;
  }

  /**
   * Calculates DOM depth of an element
   */
  private getDepth(el: HTMLElement): number {
    let depth = 0;
    let current: HTMLElement | null = el;

    while (current) {
      depth++;
      current = current.parentElement;
    }

    return depth;
  }

  /**
   * Cleans up elements that are no longer in the DOM
   */
  private cleanup() {
    for (const el of [...this.visibleElements]) {
      if (!el.isConnected) {
        this.visibleElements.delete(el);
        this.observer.unobserve(el);

        if (this.activeElement === el) {
          this.activeElement = null;
        }
      }
    }
  }
}

export const hotKeys = new HotKeys();
