import type { SequenceEvent, ToString } from "@hotora/core";

export enum Keys {
  A = "KeyA",
  B = "KeyB",
  C = "KeyC",
  D = "KeyD",
  E = "KeyE",
  F = "KeyF",
  G = "KeyG",
  H = "KeyH",
  I = "KeyI",
  J = "KeyJ",
  K = "KeyK",
  L = "KeyL",
  M = "KeyM",
  N = "KeyN",
  O = "KeyO",
  P = "KeyP",
  Q = "KeyQ",
  R = "KeyR",
  S = "KeyS",
  T = "KeyT",
  U = "KeyU",
  V = "KeyV",
  W = "KeyW",
  X = "KeyX",
  Y = "KeyY",
  Z = "KeyZ",

  Digit0 = "Digit0",
  Digit1 = "Digit1",
  Digit2 = "Digit2",
  Digit3 = "Digit3",
  Digit4 = "Digit4",
  Digit5 = "Digit5",
  Digit6 = "Digit6",
  Digit7 = "Digit7",
  Digit8 = "Digit8",
  Digit9 = "Digit9",

  Numpad0 = "Numpad0",
  Numpad1 = "Numpad1",
  Numpad2 = "Numpad2",
  Numpad3 = "Numpad3",
  Numpad4 = "Numpad4",
  Numpad5 = "Numpad5",
  Numpad6 = "Numpad6",
  Numpad7 = "Numpad7",
  Numpad8 = "Numpad8",
  Numpad9 = "Numpad9",
  NumpadAdd = "NumpadAdd",
  NumpadSubtract = "NumpadSubtract",
  NumpadMultiply = "NumpadMultiply",
  NumpadDivide = "NumpadDivide",
  NumpadDecimal = "NumpadDecimal",
  NumpadEnter = "NumpadEnter",

  F1 = "F1",
  F2 = "F2",
  F3 = "F3",
  F4 = "F4",
  F5 = "F5",
  F6 = "F6",
  F7 = "F7",
  F8 = "F8",
  F9 = "F9",
  F10 = "F10",
  F11 = "F11",
  F12 = "F12",
  F13 = "F13",
  F14 = "F14",
  F15 = "F15",
  F16 = "F16",
  F17 = "F17",
  F18 = "F18",
  F19 = "F19",
  F20 = "F20",

  Escape = "Escape",
  Tab = "Tab",
  CapsLock = "CapsLock",
  ShiftLeft = "ShiftLeft",
  ShiftRight = "ShiftRight",
  ControlLeft = "ControlLeft",
  ControlRight = "ControlRight",
  AltLeft = "AltLeft",
  AltRight = "AltRight",
  MetaLeft = "MetaLeft",
  MetaRight = "MetaRight",
  Space = "Space",
  Enter = "Enter",
  Backspace = "Backspace",
  Delete = "Delete",
  Insert = "Insert",
  Home = "Home",
  End = "End",
  PageUp = "PageUp",
  PageDown = "PageDown",

  ArrowUp = "ArrowUp",
  ArrowDown = "ArrowDown",
  ArrowLeft = "ArrowLeft",
  ArrowRight = "ArrowRight",

  Minus = "Minus",
  Equal = "Equal",
  BracketLeft = "BracketLeft",
  BracketRight = "BracketRight",
  Backslash = "Backslash",
  Semicolon = "Semicolon",
  Quote = "Quote",
  Backquote = "Backquote",
  Comma = "Comma",
  Period = "Period",
  Slash = "Slash",
}

export interface InputsEvent<
  TStep extends ToString,
> extends SequenceEvent<TStep> {
  stopPropagation: () => void;
}

export interface Entry<TElement extends WeakKey> {
  target: TElement;
  isIntersecting: boolean;
}

export type InputHandler<TStep extends ToString> = (step: TStep) => void;
export type PointerHandler<TElement extends WeakKey> = (
  element: TElement,
) => void;
export type ObserveHandler<TElement extends WeakKey> = (
  entries: Entry<TElement>[],
) => void;
export interface EventProvider<
  TElement extends WeakKey,
  TStep extends ToString,
> {
  observe: (
    element: TElement,
    handler: ObserveHandler<TElement>,
    signal: AbortSignal,
  ) => void;
  unobserve: (element: TElement) => void;
  onInputStart: (handler: InputHandler<TStep>, signal: AbortSignal) => void;
  onInputEnd: (handler: InputHandler<TStep>, signal: AbortSignal) => void;
  onPointer: (handler: PointerHandler<TElement>, signal: AbortSignal) => void;
  getParentElement: (element: TElement) => TElement | null;
  getIsElementConnected: (element: TElement) => boolean;
}

export type InferElement<T> = T extends EventProvider<infer E, any> ? E : never;
export type InferStep<T> = T extends EventProvider<any, infer K> ? K : never;
