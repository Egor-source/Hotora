# Inputs

Lightweight JavaScript and TypeScript library for handling keyboard shortcuts, gestures and complex sequences with customizable scoped actions.

## Features

- Step combinations and sequences
- Scoped handlers (local + global)
- Element binding
- Visibility-aware
- Smart active element resolution
- Scope propagation control (`stopPropagation`)
- Pluggable event providers (DOM, SSR-safe, custom)

---

## Installation

```bash
npm install @hotora/inputs
```

---

## Basic Usage

### Default (browser)

```ts
import { createInputsManager, Keys } from "@hotora/inputs";

const inputsManager = createInputsManager();

inputsManager.register([Keys.A], {
  handler: () => {
    console.log("Pressed A");
  },
});
```

For correct operation, it is best to use 1 InputsManager instance at a time.
Otherwise stopPropagation may not work.

---

## Step Combinations

Register multi-step combinations:

```ts
inputsManager.register([Keys.ControlLeft, Keys.A], {
  handler: () => {
    console.log("Ctrl + A");
  },
});
```

The handler fires when all steps are fired simultaneously.

---

## Step Sequences

Register ordered sequences:

```ts
inputsManager.register([[Keys.ControlLeft], [Keys.A]], {
  handler: () => {
    console.log("Ctrl → A");
  },
});
```

The handler fires only when steps are fired in order.

---

## Scoped Sequences

Bind sequence to an element and scope:

```ts
const element = document.getElementById("editor");

inputsManager.register(
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
2. On step fire:

- active element is resolved
- scope chain is built (element → parents → `$global`)
- handlers execute in order

---

## Global Scope

All handlers fallback to `$global`:

```ts
inputsManager.register([Keys.Escape], {
  handler: () => console.log("Global escape"),
});
```

---

## stopPropagation

Prevent execution in parent scopes:

```ts
inputsManager.register([Keys.S], {
  handler: (e) => {
    e.stopPropagation();
    console.log("Handled locally only");
  },
});
```

---

## Active Element Resolution

InputsManager determines active element using:

1. Last pointer interaction (click/touch)
2. Only visible elements
3. If multiple:

- prefers last active
- otherwise deepest

---

## Providers

InputsManager is provider-based.  
Event handling is abstracted via `EventProvider`.

### DOMKeyboardEventProvider (used by default)

Uses real DOM APIs:

- `keydown` / `keyup`
- `mousedown` / `touchstart`
- `IntersectionObserver`

```ts
import { createInputsManager, DOMKeyboardEventProvider } from "@hotora/inputs";

const inputsManager = createInputsManager(new DOMKeyboardEventProvider());
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
  DOMKeyboardEventProvider,
  createInputsManager,
} from "@hotora/inputs";

const provider = new LazyEventProvider(() => {
  if (typeof window !== "undefined") {
    return new DOMKeyboardEventProvider();
  }
  return null;
});

const inputsManager = createInputsManager(provider);
```

---

### Custom providers

You can implement your own provider (e.g. canvas, WebGL, game engine):

```ts
import type { EventProvider } from "";

class MyProvider implements EventProvider<any, any> {
  // implement interface
}
```

---

## EventProvider Interface

Custom providers implement `EventProvider<TElement, TStep>` to handle events in different environments:

```ts
interface EventProvider<TElement, TStep> {
  onInputStart(handler: InputHandler<TStep>, signal: AbortSignal): void;
  onInputEnd(handler: InputHandler<TStep>, signal: AbortSignal): void;
  onPointer(handler: PointerHandler<TElement>, signal: AbortSignal): void;
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

- Allows InputsManager to work with browser DOM, SSR, or test environments
- Supports lazy initialization for SSR or deferred providers
- Handlers are automatically queued until the provider is ready

## API

### InputsManager

#### `createInputsManager(provider?)`

Creates a new instance with a specific EventProvider.

```ts
const inputsManager = createInputsManager(provider);
```

---

#### `register(sequence, setup, element?, scope?)`

Registers a steps or stepsSequence.

```ts
register(
  Steps | StepsSequence,
  {
    handler: (event) => void;
    clearDuration?: number;
  },
  element?: TElement,
  scope?: string
): ActionId
```

---

#### `unregister(id)`

Removes a previously registered handlers.

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

- `DOMKeyboardEventProvider` is **not SSR-safe**
- Use `LazyEventProvider` for:
  - SSR frameworks (Next.js, Nuxt)
  - dynamic imports
  - delayed initialization

---

## Example

```ts
import { createInputsManager } from "@hotora/inputs";

const modal = document.getElementById("modal");

const inputsManager = createInputsManager();

inputsManager.register(
  [Keys.Escape],
  {
    handler: () => console.log("Close modal"),
  },
  modal,
  "modal",
);

inputsManager.register([Keys.Escape], {
  handler: () => console.log("Global escape fallback"),
});
```

---

## License

MIT
