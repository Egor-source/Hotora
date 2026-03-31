import { useCallback, useContext, useEffect, useRef } from "react";
import { getInputContext } from "./context";
import type {
  ActionId,
  EventProvider,
  InferElement,
  InferStep,
  InputsEvent,
  SequenceAction,
  Stage,
} from "@hotora/inputs";

/**
 * Subscribes to an input sequence using the InputsManager from context.
 *
 * This hook is intentionally **non-reactive**.
 *
 * Behavior:
 * - The sequence is registered once on mount.
 * - Updates to `sequence`, `setup`, or `scope` are NOT tracked.
 * - Internal values are kept via refs but do not trigger re-registration.
 * - Cleanup happens automatically on unmount.
 *
 * Scope modes:
 * - Global (`"$global"`):
 *   The sequence is registered globally and managed internally via effect.
 *
 * - Scoped (any other value):
 *   The hook returns a ref callback that must be attached to a DOM element.
 *   The sequence will only be active within that element and scope.
 *
 * Imperative control:
 * For dynamic registration, updates, or manual lifecycle control,
 * use `InputsManager` instead.
 *
 * @typeParam TProvider - Event provider type used to infer element and step types.
 *
 * @param sequence - Input sequence (single stage or array of stages).
 * @param setup - Sequence configuration and handlers (excluding `id` and `sequence`).
 * @param scope - Optional scope identifier. Defaults to `"$global"`.
 *
 * @returns
 * - In global mode: nothing (side-effect only).
 * - In scoped mode: ref callback to attach to a DOM element.
 *
 * @throws If used outside of `HotoraInputsProvider`.
 *
 * @example Global usage
 * ```ts
 * useHotoraInputs(["KeyA", "KeyB"], {
 *   handler: () => console.log("matched"),
 * });
 * ```
 *
 * @example Scoped usage
 * ```tsx
 * const ref = useHotoraInputs(["KeyA"], {
 *   handler: handleMatch,
 * }, "local-scope");
 *
 * return <div ref={ref} />;
 * ```
 *
 * @remarks
 * - Do not expect reactive updates when inputs change.
 * - Re-initialization requires remounting the hook or using the manager API.
 * - Using the returned ref in global mode is invalid and will trigger a warning.
 */
export function useHotoraInputs<
  TProvider extends EventProvider<
    InferElement<TProvider>,
    InferStep<TProvider>
  >,
>(
  sequence: Stage<InferStep<TProvider>> | Stage<InferStep<TProvider>>[],
  setup: Omit<
    SequenceAction<InferStep<TProvider>, InputsEvent<InferStep<TProvider>>>,
    "id" | "sequence"
  >,
  scope: string = "$global",
) {
  const InputsContext = getInputContext<TProvider>();
  const manager = useContext(InputsContext);
  if (!manager) {
    throw new Error("useInputsManager must be used within an InputsProvider");
  }

  const id = useRef<ActionId | null>(null);

  const sequenceRef = useRef(sequence);
  const setupRef = useRef(setup);
  const scopeRef = useRef(scope);

  sequenceRef.current = sequence;
  setupRef.current = setup;
  scopeRef.current = scope;

  useEffect(() => {
    if (scope === "$global") {
      const actionId = manager.register(sequenceRef.current, setupRef.current);

      return () => {
        manager.unregister(actionId);
      };
    }
  }, [manager]);

  return useCallback(
    (node: InferElement<TProvider>) => {
      if (scope === "$global") {
        console.warn("Dont use ref with global scope");
        return;
      }

      if (!node) {
        if (id.current) {
          manager.unregister(id.current);
          id.current = null;
        }
        return;
      }

      id.current = manager.register(
        sequenceRef.current,
        setupRef.current,
        node,
        scopeRef.current,
      );
    },
    [manager],
  );
}
