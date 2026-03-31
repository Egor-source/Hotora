"use client";
import type { HotoraScopeProps } from "./types";
import { useHotoraInputs } from "./useHotoraInputs";
import { useId } from "react";
import type { EventProvider } from "@hotora/inputs";

/**
 * Creates an isolated input scope bound to a DOM element.
 *
 * This component attaches an input sequence listener to its root element
 * and limits its effect to a unique scope. Useful for separating input handling
 * between different parts of the UI.
 *
 * Internally:
 * - Generates a stable unique scope ID using `useId`.
 * - Subscribes to the provided input sequence via `useHotoraInputs`.
 * - Binds the sequence to the rendered DOM element via a ref.
 *
 * @param props.children - React children rendered inside the scoped container.
 * @param props.sequence - Input sequence to listen for.
 * @param props.setup - Optional configuration or handler for the sequence.
 *
 * @returns A div element with an attached input listener and scope identifier.
 *
 * @example
 * ```tsx
 * <HotoraScope sequence={["KeyA", "KeyB"]} setup={{ handler: handleMatch }}>
 *   <GameArea />
 * </HotoraScope>
 * ```
 *
 * @remarks
 * Each instance creates its own isolated scope. Sequences triggered inside one
 * scope will not interfere with others.
 */
export const HotoraScope = ({
  children,
  sequence,
  setup,
}: HotoraScopeProps) => {
  const scope = useId();
  const ref = useHotoraInputs<EventProvider<any, any>>(sequence, setup, scope);
  return (
    <div ref={ref} data-scope={scope}>
      {children}
    </div>
  );
};
