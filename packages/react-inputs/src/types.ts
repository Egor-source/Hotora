import type { ReactNode } from "react";
import type {
  EventProvider,
  InputsEvent,
  InputsManager,
  SequenceAction,
  Stage,
  ToString,
} from "@hotora/inputs";

export type InputsProviderProps = {
  children: ReactNode;
} & (
  | { provider: EventProvider<any, any>; manager?: never }
  | {
      manager: InputsManager<EventProvider<any, any>>;
      provider?: never;
    }
  | { provider?: never; manager?: never }
);

export type HotoraScopeProps = {
  sequence: Stage<ToString> | Stage<ToString>[];
  setup: Omit<
    SequenceAction<ToString, InputsEvent<ToString>>,
    "id" | "sequence"
  >;
  children: ReactNode;
};
