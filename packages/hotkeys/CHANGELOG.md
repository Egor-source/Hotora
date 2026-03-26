# @hotora/hotkeys

## 2.0.0

### Major Changes

- All notable changes to this project will be documented in this file.

  ***

  `HotKeys` is no longer a singleton.

  You must now explicitly create an instance using the factory function:

  ```ts
  import { createHotKeys } from "@hotora/hotkeys";

  const hotKeys = createHotKeys();
  ```

  ***
  - Removed all direct `window` / DOM access from `HotKeys`
  - Introduced a provider-based architecture
  - Event handling is now fully delegated to `EventProvider`

  ***

  HotKeys now supports pluggable event providers:
  - `DOMEventProvider` — handles browser DOM events
  - `LazyEventProvider` — enables SSR-safe and lazy initialization

  ***

  By default, `createHotKeys()` uses:

  ```ts
  LazyEventProvider(() => new DOMEventProvider());
  ```

  This means:
  - ✅ Works in browser out of the box
  - ✅ Safe to import in SSR (no `window` access)
  - ✅ Lazy initialization

  ***

  HotKeys can now be safely used in server environments:
  - No runtime errors during import
  - No direct DOM assumptions
  - Providers can be injected later

  ***
  - Key handling
  - Pointer tracking
  - Visibility observation
  - Scope resolution

  All now work through the provider system and are environment-agnostic.

  ***

  ```ts
  import { createHotKeys } from "@hotora/hotkeys";

  const hotKeys = createHotKeys();
  ```

  ***

  ```ts
  import {
    createHotKeys,
    LazyEventProvider,
    DOMEventProvider,
  } from "@hotora/hotkeys";

  const provider = new LazyEventProvider(() => new DOMEventProvider());
  const hotKeys = createHotKeys(provider);
  ```

  ***

  ```ts
  interface EventProvider<TElement, TKey> {
    onKeyDown(handler: (key: TKey) => void, signal: AbortSignal): void;
    onKeyUp(handler: (key: TKey) => void, signal: AbortSignal): void;
    onPointer(handler: (target: TElement) => void, signal: AbortSignal): void;
    observe(
      element: TElement,
      callback: (entries: Entry<TElement>[]) => void,
      signal: AbortSignal,
    ): void;
    unobserve(element: TElement): void;
    getParentElement(element: TElement): TElement | null;
    getIsElementConnected(element: TElement): boolean;
  }
  ```

  ***

  ```ts
  import { hotKeys } from "@hotora/hotkeys";

  hotKeys.register(...);
  ```

  ***

  ```ts
  import { createHotKeys } from "@hotora/hotkeys";

  const hotKeys = createHotKeys();
  hotKeys.register(...);
  ```

  ***

  ```ts
  const hotKeys = createHotKeys(customProvider);
  ```

  ***
  - Singleton removed → explicit instance creation
  - Provider-based architecture → flexible & extensible
  - SSR-safe by default
  - Improved type inference via `createHotKeys`
  - Cleaner and more scalable design

## 1.0.1

### Patch Changes

- 0df59b2: Add hotkeys functional
