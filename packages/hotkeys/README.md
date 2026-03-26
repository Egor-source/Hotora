# HotKeys

Lightweight hotkey manager with support for key sequences, scoped handlers, and pluggable event providers.

## Features

- Key combinations and sequences
- Scoped handlers (local + global)
- Element binding
- Visibility-aware
- Smart active element resolution
- Scope propagation control (`stopPropagation`)
- Pluggable event providers (DOM, SSR-safe, custom)

---

## Installation

```bash
npm install @hotora/hotkeys
```

---

## Basic Usage

### Default (browser)

```ts
import { createHotKeys, Keys } from "@hotora/hotkeys";

const hotKeys = createHotKeys();

hotKeys.register([Keys.A], {
  handler: () => {
    console.log("Pressed A");
  },
});
```

For correct operation, it is best to use 1 HotKeys instance at a time.
Otherwise stopPropagation may not work.

---

## Key Combinations

Register multi-key combinations:

```ts
hotKeys.register([Keys.ControlLeft, Keys.A], {
  handler: () => {
    console.log("Ctrl + A");
  },
});
```

The handler fires when all keys are pressed simultaneously.

---

## Key Sequences

Register ordered sequences:

```ts
hotKeys.register([[Keys.ControlLeft], [Keys.A]], {
  handler: () => {
    console.log("Ctrl → A");
  },
});
```

The handler fires only when keys are pressed in order.

---

## Scoped Hotkeys

Bind hotkeys to an element and scope:

```ts
const element = document.getElementById("editor");

hotKeys.register(
  [Keys.S],
  {
    handler: () => console.log("Save inside editor"),
  },
  element,
  "editor",
);
```

---

### How scopes work

1. Scope is attached to an element
2. On key press:

- active element is resolved
- scope chain is built (element → parents → `$global`)
- handlers execute in order

---

## Global Scope

All handlers fallback to `$global`:

```ts
hotKeys.register([Keys.Escape], {
  handler: () => console.log("Global escape"),
});
```

---

## stopPropagation

Prevent execution in parent scopes:

```ts
hotKeys.register([Keys.S], {
  handler: (e) => {
    e.stopPropagation();
    console.log("Handled locally only");
  },
});
```

---

## Active Element Resolution

HotKeys determines active element using:

1. Last pointer interaction (click/touch)
2. Only visible elements
3. If multiple:

- prefers last active
- otherwise deepest in DOM

---

## Providers

HotKeys is provider-based.  
Event handling is abstracted via `EventProvider`.

### DOMEventProvider (used by default)

Uses real DOM APIs:

- `keydown` / `keyup`
- `mousedown` / `touchstart`
- `IntersectionObserver`

```ts
import { createHotKeys, DOMEventProvider } from "@hotora/hotkeys";

const hotKeys = createHotKeys(new DOMEventProvider());
```

---

### LazyEventProvider (SSR / async)

Safe for SSR and dynamic environments.

- Buffers subscriptions
- Initializes provider lazily
- Supports async factory

```ts
import {
  LazyEventProvider,
  DOMEventProvider,
  createHotKeys,
} from "@hotora/hotkeys";

const provider = new LazyEventProvider(() => {
  if (typeof window !== "undefined") {
    return new DOMEventProvider();
  }
  return null;
});

const hotKeys = createHotKeys(provider);
```

---

### Custom providers

You can implement your own provider (e.g. canvas, WebGL, game engine):

```ts
import type { EventProvider } from "@hotora/hotkeys";

class MyProvider implements EventProvider<any, any> {
  // implement interface
}
```

---

## EventProvider Interface

Custom providers implement `EventProvider<TElement, TKey>` to handle events in different environments:

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

- Allows HotKeys to work with browser DOM, SSR, or test environments
- Supports lazy initialization for SSR or deferred providers
- Handlers are automatically queued until the provider is ready

## API

### Hotkeys

#### `createHotKeys(provider?)`

Creates a new instance with a specific EventProvider.

```ts
const hotKeys = createHotKeys(provider);
```

---

#### `register(sequence, setup, element?, scope?)`

Registers a hotkey or sequence.

```ts
register(
  Combo | ComboSequence,
  {
    handler: (event) => void;
    clearDuration?: number;
  },
  element?: HTMLElement,
  scope?: string
): ActionId
```

---

#### `unregister(id)`

Removes a previously registered hotkey.

---

#### `destroy()`

Cleans up all subscriptions.

---

### LazyEventProvider

#### new LazyEventProvider(providerFactory)

Creates new instance with a provider factory

```ts
const factory = () => {
  import("./CustomEventProvider").then((m) => new m.CustomEventProvider());
};
const provider = new LazyEventProvider(factory);
```

---

#### isReady: boolean

Indicates whether the provider has already been initialized or not.

---

#### reinitialize()

Restarts the provider initialization.

---

## Event Object

Handler receives:

```ts
{
  stopPropagation: () => void;
  sequence: Sequence;
  activeSteps: Set;
  timestamp: number;
}
```

---

## SSR Notes

- `DOMEventProvider` is **not SSR-safe**
- Use `LazyEventProvider` for:
  - SSR frameworks (Next.js, Nuxt)
  - dynamic imports
  - delayed initialization

---

## Example

```ts
import { createHotKeys } from "@hotora/hotkeys";

const modal = document.getElementById("modal");

const hotKeys = createHotKeys();

hotKeys.register(
  [Keys.Escape],
  {
    handler: () => console.log("Close modal"),
  },
  modal,
  "modal",
);

hotKeys.register([Keys.Escape], {
  handler: () => console.log("Global escape fallback"),
});
```

---

## License

MIT
