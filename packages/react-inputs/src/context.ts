import { type Context, createContext } from "react";
import type {
  EventProvider,
  InferElement,
  InferStep,
  InputsManager,
} from "@hotora/inputs";

let context: Context<InputsManager<EventProvider<any, any>> | null>;

/**
 * Returns a singleton React context for the InputsManager.
 *
 * The context is lazily created on the first call and reused afterwards.
 *
 * Important:
 * - The context instance is created only once, regardless of the generic type.
 * - The `TProvider` generic is used for TypeScript typing only.
 * - All calls to `getInputContext` must use the same provider type,
 *   otherwise type mismatches may occur.
 *
 * @typeParam TProvider - Event provider type that defines element and step structure.
 *
 * @returns React Context containing the InputsManager instance or null
 *          if no provider is set.
 *
 * @example
 * ```ts
 * const InputsContext = getInputContext<MyEventProvider>();
 * ```
 */
export const getInputContext = <
  TProvider extends EventProvider<
    InferElement<TProvider>,
    InferStep<TProvider>
  > = EventProvider<any, any>,
>() => {
  if (!context) context = createContext<InputsManager<TProvider> | null>(null);
  return context;
};
