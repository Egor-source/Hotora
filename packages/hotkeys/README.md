# HotKeys

Lightweight hotkey manager with support for key sequences, scoped handlers, and DOM-based context resolution.

## Features

- Key combinations and sequences
- Scoped handlers (local + global)
- DOM element binding
- Visibility-aware (via `IntersectionObserver`)
- Smart active element resolution
- Scope propagation control (`stopPropagation`)

---

## Installation

```bash
npm install @hotora/hotkeys
```

---

## Basic Usage

```ts
import { hotKeys, Keys } from "@hotora/hotkeys";

hotKeys.register([Keys.A], {
  handler: () => {
    console.log("Pressed A");
  },
});
```

---

## Key Combinations

You can register multi-step combination:

```ts
hotKeys.register([Keys.ControlLeft, Keys.A], {
  handler: () => {
    console.log("Ctrl + A");
  },
});
```

The handler will only work after you press Ctrl and the A key together.

---

## Key Sequences

You can register multi-step sequences:

```ts
hotKeys.register([[Keys.ControlLeft], [Keys.A]], {
  handler: () => {
    console.log("Ctrl → A");
  },
});
```

The handler only works after pressing Ctrl and then the A key.

---

## Scoped Hotkeys

Bind hotkeys to a specific DOM element and scope:

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

### How scopes work

- Scope is attached to a DOM element
- When a key is pressed, HotKeys:
  1. Resolves active element
  2. Builds scope chain (element → parents → `$global`)
  3. Executes handlers in order

---

## Global Scope

All handlers fallback to `$global` if no scoped handler stops propagation.

```ts
import { Keys } from "@hotora/hotkeys/dist";

hotKeys.register([Keys.Escape], {
  handler: () => console.log("Global escape"),
});
```

---

## stopPropagation

Prevent execution of handlers in parent scopes:

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
2. Only visible elements are considered
3. If multiple visible elements:

- prefers last active
- otherwise chooses deepest in DOM

---

## API

### `register(sequence, setup, element?, scope?)`

Registers a hotkey or sequence.

```ts
register(
  Combo | Sequence,
  {
    handler: (event) => void
    clearDuration?: number
  },
  element: HTMLElement,
  scope?: string
): ActionId
```

---

### `unregister(id)`

Removes a previously registered hotkey.

---

## Event

Handler receives:

```ts
{
  stopPropagation: ()=> void;
  sequence: Sequence;
  activeSteps: Set;
  timestamp: number;
}
```

---

## Example

```ts
const modal = document.getElementById("modal");

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
