# Core

Small engine for handling **step stages and sequences**.

Supports:

- step stage (`A + B`)
- stage sequences (`A+B → C`)
- scoped actions (same combos in different contexts)
- sequence timeouts

---

## Install

```bash
npm install sequence-controller
```

---

## Basic usage

```ts
const controller = new SequenceController<string>();

controller.register(["Ctrl", "S"], {
  handler: () => console.log("Save"),
});

controller.emitStep("Ctrl");
controller.emitStep("S");
```

---

## Keyboard example

```ts
const controller = new SequenceController<string>();
controller.register(["Ctrl", "S"], {
  handler: () => console.log("Save"),
});

window.addEventListener("keydown", (e) => {
  const fired = controller.emitStep(e.key);

  for (const [event, handler] of fired) {
    handler(event);
  }
});

window.addEventListener("keyup", (e) => {
  controller.removeStep(e.key);
});
```

---

## Combos

```ts
controller.register(["Ctrl", "S"], {
  handler: () => console.log("Save"),
});
```

---

## Sequences

```ts
controller.register(
  [
    ["Ctrl", "K"],
    ["Ctrl", "C"],
  ],
  {
    handler: () => console.log("Comment"),
  },
);
```

Execution order:

    Ctrl+K → Ctrl+C

---

## Scope

Scopes isolate actions so the same combos can exist in different
contexts.

```ts
controller.register(["Enter"], { handler: submitForm }, "modal");

controller.emitStep("Enter", "modal");
```

Default scope:

    $global

---

## Sequence timeout

Default: **3 seconds**

```ts
controller.register([["A"], ["B"]], {
  clearDuration: 5,
  handler: () => console.log("Triggered"),
});
```

---

## API

### register(sequence, setup, scope?)

Registers an action.

```ts
register(
  Combo | Sequence,
  {
    handler: (event) => void
    clearDuration?: number
  },
  scope?: string
): ActionId
```

---

### emitStep(step, scope?)

Processes a step.

Returns actions to execute.

```ts
const fired = controller.emitStep(step);

for (const [event, handler] of fired) {
  handler(event);
}
```

---

### removeStep(step)

Removes step from active steps.

Used for events like `keyup`.

---

### unregister(id)

Removes registered action.

---

## Event

Handler receives:

```ts
{
  sequence: Sequence;
  activeSteps: Set;
  timestamp: number;
}
```

---

## License

MIT
