"use client";
import type { FC } from "react";
import { useMemo, useEffect } from "react";
import { createInputsManager } from "@hotora/inputs";
import { getInputContext } from "./context";
import type { InputsProviderProps } from "./types";

/**
 * React provider that supplies an InputsManager instance via context.
 *
 * Supports both controlled and uncontrolled usage:
 *
 * - Controlled mode: pass an existing `manager` instance.
 * - Uncontrolled mode: a new manager will be created internally
 *   using the provided `provider` (or default configuration).
 *
 * Lifecycle:
 * - If the manager is created internally, it will be automatically destroyed
 *   on component unmount.
 * - If an external manager is provided, its lifecycle is not managed here.
 *
 * @param props.children - React children that will have access to the context.
 * @param props.provider - Optional event provider used to create a manager instance.
 * @param props.manager - Optional external InputsManager (controlled mode).
 *
 * @returns Context provider with the active InputsManager instance.
 *
 * @example
 * ```tsx
 * <HotoraInputsProvider provider={myProvider}>
 *   <App />
 * </HotoraInputsProvider>
 * ```
 *
 * @example Controlled usage
 * ```tsx
 * const manager = createInputsManager(myProvider);
 *
 * <HotoraInputsProvider manager={manager}>
 *   <App />
 * </HotoraInputsProvider>
 * ```
 */
export const HotoraInputsProvider: FC<InputsProviderProps> = ({
  children,
  provider,
  manager: externalManager,
}) => {
  const InputsContext = getInputContext();
  const manager = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    if (externalManager) return externalManager;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return provider ? createInputsManager(provider) : createInputsManager();
  }, [externalManager, provider]);

  useEffect(() => {
    return () => {
      if (!externalManager) {
        manager.destroy();
      }
    };
  }, [manager, externalManager]);

  return (
    <InputsContext.Provider value={manager}>{children}</InputsContext.Provider>
  );
};
