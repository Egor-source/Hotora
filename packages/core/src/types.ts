export type ToString = { toString: () => string };

export type ActionId = string;

export type Scope = string;

export type Step<T extends ToString> = T;

export type Stage<T extends ToString> = Step<T>[];

export type Sequence<T extends ToString> = Stage<T>[];

export type SequenceEvent<T extends ToString> = {
  sequence: Sequence<T>;
  activeSteps: Set<T>;
  timestamp: number;
};

export type Fired<
  T extends ToString,
  K extends SequenceEvent<T> = SequenceEvent<T>,
> = [SequenceEvent<T>, SequenceActionHandler<T, K>][];

export type SequenceActionHandler<
  T extends ToString,
  K extends SequenceEvent<T> = SequenceEvent<T>,
> = (e: K) => void;

export type SequenceAction<
  T extends ToString,
  K extends SequenceEvent<T> = SequenceEvent<T>,
> = {
  id: ActionId;
  sequence: Sequence<T>;
  handler: SequenceActionHandler<T, K>;
  clearDuration?: number;
};

export type ActionIndexEntry<
  T extends ToString,
  K extends SequenceEvent<T> = SequenceEvent<T>,
> = {
  action: SequenceAction<T, K>;
  index: number;
};

export type ActionIndex<
  T extends ToString,
  K extends SequenceEvent<T> = SequenceEvent<T>,
> = Map<ActionId, ActionIndexEntry<T, K>[]>;

export type ActionCandidate = {
  index: number;
  timestamp: number;
  clearDuration: number | undefined;
};

export type ActionsCandidates = Map<ActionId, ActionCandidate>;
