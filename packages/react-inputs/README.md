# @hotora/react-inputs

React bindings for `@hotora/inputs` — a lightweight system for keyboard shortcuts, sequences, and scoped input handling in React applications.

It provides declarative and scoped APIs on top of the core `InputsManager`.

---

## Features

- React Context integration
- Declarative & scoped input handling
- Element-bound sequences via refs
- Global + local scope support
- SSR-safe provider support
- Fully compatible with `@hotora/inputs`
- No reactive re-subscription model (stable registration)

---

## Installation

```bash
npm install @hotora/react-inputs @hotora/inputs
```

---

## Core Concept

This library is a thin React layer over `@hotora/inputs`.

It does NOT replace the core logic — it only:

- provides context
- binds inputs to React lifecycle
- exposes React-friendly hooks

---

## Provider

### HotoraInputsProvider

Provides a shared `InputsManager` instance via React context.

Supports:

- Uncontrolled mode (default): manager is created internally
- Controlled mode: external manager can be passed in

```tsx
<HotoraInputsProvider>
  <App />
</HotoraInputsProvider>
```

---

### Uncontrolled usage (recommended)

```tsx
<HotoraInputsProvider provider={myProvider}>
  <App />
</HotoraInputsProvider>
```

---

### Controlled usage

```tsx
const manager = createInputsManager(myProvider);

<HotoraInputsProvider manager={manager}>
  <App />
</HotoraInputsProvider>;
```

---

## Scope System

### HotoraScope

Creates an isolated input scope bound to a DOM element.

Each scope:

- binds sequences to a specific DOM node
- participates in scope resolution chain
- supports parent → child propagation rules

```tsx
import { HotoraScope } from "@hotora/react-inputs";

<HotoraScope sequence={["KeyA", "KeyB"]} setup={setup}>
  <Game />
</HotoraScope>;
```

---

## Hook API

### useHotoraInputs

Registers an input sequence using the `InputsManager` from context.

> ⚠️ This hook is intentionally **non-reactive**

Changes to `sequence`, `setup`, or `scope` do NOT trigger re-registration.

---

## Global usage

Registers a global shortcut (no DOM binding required):

```tsx
useHotoraInputs(["Escape"], {
  handler: () => {
    console.log("Escape pressed");
  },
});
```

---

## Scoped usage (element-bound)

In scoped mode, the hook returns a **ref callback** that must be attached to a DOM element.

The sequence will only be active when the element is part of the active scope chain.

```tsx
const ref = useHotoraInputs(
  ["KeyS"],
  {
    handler: () => {
      console.log("Save triggered inside scope");
    },
  },
  "editor",
);

return (
  <div ref={ref}>
    <textarea />
  </div>
);
```

---

## How scoped mode works

1. A unique action is registered for the sequence
2. The returned ref binds the action to a DOM element
3. Inputs are resolved through scope chain:

   ```
   element → parent scopes → $global
   ```

4. The handler fires only when the active element is inside that scope

---

## Important behavior

- Scoped mode requires attaching the returned ref to a DOM element
- If the ref is not attached → sequence is inactive
- Moving element between scopes automatically rebinds the action
- Cleanup is automatic on unmount

---

## Invalid usage

```tsx
// ❌ invalid: scoped mode without attaching ref
useHotoraInputs(["KeyS"], setup, "editor");
```

```tsx
// ❌ invalid: using ref in global mode
const ref = useHotoraInputs(["Escape"], setup);
```

---

## Mental model

```
Global mode:
  sequence → InputsManager → handler

Scoped mode:
  DOM element → scope resolution → InputsManager → handler
```

---

## Key Design Decisions

### 1. Non-reactive by design

Inputs are NOT re-registered when props change.
This ensures predictable behavior and stable performance.

---

### 2. Single manager model

Only one `InputsManager` instance is recommended per application.
Multiple managers may break scope propagation.

---

### 3. Scope-first architecture

All inputs resolve through:

```
element → parent scopes → global
```

---

## Compatibility

- React 18+
- Next.js (App Router / Pages Router)
- SSR environments (with LazyEventProvider from core)
- Custom event providers

---

## License

MIT
