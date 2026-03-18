import type {
  ActionId,
  ActionIndex,
  ActionsCandidates,
  Stage,
  Fired,
  Scope,
  Sequence,
  SequenceAction,
  SequenceEvent,
  Step,
  ToString,
} from "./types";

/**
 * SequenceController manages step combinations and sequences.
 *
 * It allows registering actions that should fire when specific
 * combinations or ordered sequences of combinations occur.
 *
 * Steps represent currently active inputs (e.g. pressed keys).
 * Actions are grouped by scopes so the same combinations can
 * be reused in different contexts (e.g. editor, modal, global).
 */
export class SequenceController<T extends ToString> {
  /** Currently active steps (global state). */
  private activeSteps = new Set<T>();
  /**
   * Index of actions grouped by scope.
   *
   * Structure:
   * scope -> comboKey -> ComboIndexEntry[]
   */
  private scopedIndexes = new Map<Scope, ActionIndex<T>>();
  /**
   * Current candidates for sequence progression.
   *
   * Stores partial progress of sequences that already matched
   * one or more combos but haven't finished yet.
   *
   * Structure:
   * scope -> actionId -> candidateState
   */
  private scopedCandidates = new Map<Scope, ActionsCandidates>();

  /**
   * Registers a new sequence action.
   *
   * @param sequence A single combo or an ordered sequence of combos.
   * @param setup Action configuration (handler, clearDuration, etc.).
   * @param scope Logical context where this action is active.
   *
   * @returns ActionId that can be used later to unregister the action.
   */
  register(
    sequence: Stage<T> | Stage<T>[],
    setup: Omit<SequenceAction<T>, "id" | "sequence">,
    scope: Scope = "$global",
  ): ActionId {
    const id = crypto.randomUUID();
    const normalized = Array.isArray(sequence[0])
      ? (sequence as Sequence<T>)
      : ([sequence] as Sequence<T>);

    if (!normalized[0] || normalized[0].length === 0)
      throw Error("Empty sequence.");

    const action: SequenceAction<T> = {
      id,
      sequence: normalized,
      ...setup,
    };

    const actionIndex: ActionIndex<T> =
      this.scopedIndexes.get(scope) ?? (new Map() as ActionIndex<T>);

    normalized.forEach((combo, index) => {
      const key = this.comboKey(combo);
      const list = actionIndex.get(key) ?? [];
      list.push({
        action,
        index,
      });
      actionIndex.set(key, list);
    });

    this.scopedIndexes.set(scope, actionIndex);

    return id;
  }

  /**
   * Removes previously registered action.
   *
   * Also clears any pending sequence candidates associated
   * with the removed action.
   * @param id ID of the action to be deleted
   */
  unregister(id: ActionId) {
    for (const [scope, actionIndex] of this.scopedIndexes.entries()) {
      actionIndex.delete(id);
      this.scopedIndexes.set(scope, actionIndex);
    }

    for (const [scope, actionsCandidates] of this.scopedCandidates.entries()) {
      actionsCandidates.delete(id);
      this.scopedCandidates.set(scope, actionsCandidates);
    }
  }

  /**
   * Emits a new step.
   *
   * This method should be called whenever an input step occurs
   * (e.g. keydown event).
   *
   * It checks whether the current active steps match any
   * registered combos or progress any sequence.
   *
   * @param step Current step
   * @param scope Current execution context
   *
   * @returns Array of [event, handler] tuples to be executed.
   */
  emitStep(step: Step<T>, scope: Scope = "$global"): Fired<T> {
    this.cleanupCandidates(scope);
    const firedToNextStep = new Set<string>();

    const actionIndex = this.scopedIndexes.get(scope);
    if (!actionIndex) return [];
    this.activeSteps.add(step);

    const key = this.activeKey();

    const actions = actionIndex.get(key);
    if (!actions) return [];

    const actionsCandidates: ActionsCandidates =
      this.scopedCandidates.get(scope) ?? (new Map() as ActionsCandidates);

    const emitActions = actions.filter(({ action, index }) => {
      const comboIndex = actionsCandidates.get(action.id)?.index ?? 0;
      const combo = action.sequence[comboIndex];
      if (!combo || index !== comboIndex || firedToNextStep.has(action.id))
        return false;
      firedToNextStep.add(action.id);

      if (comboIndex === action.sequence.length - 1) {
        actionsCandidates.delete(action.id);
        this.scopedCandidates.set(scope, actionsCandidates);
        return true;
      }

      actionsCandidates.set(action.id, {
        index: comboIndex + 1,
        timestamp: Date.now(),
        clearDuration: action.clearDuration,
      });

      this.scopedCandidates.set(scope, actionsCandidates);

      return false;
    });

    const fired: Fired<T> = [];

    for (const { action } of emitActions) {
      fired.push([this.buildEvent(action), action.handler]);
    }

    return fired;
  }

  /**
   * Removes step from active steps set.
   *
   * Should be called when input step ends
   * (e.g. keyup event).
   * @param step Step to be deleted
   */
  removeStep(step: Step<T>) {
    this.activeSteps.delete(step);
  }

  /**
   * Creates event object passed to action handlers.
   */
  private buildEvent(action: SequenceAction<T>): SequenceEvent<T> {
    return {
      sequence: action.sequence,
      activeSteps: new Set(this.activeSteps),
      timestamp: Date.now(),
    };
  }

  /**
   * Generates a unique key for a combo.
   *
   * Steps are sorted so combo order doesn't matter.
   */
  private comboKey(combo: Stage<T>) {
    const strings = combo.map((step) => step.toString()).sort();
    return JSON.stringify(strings);
  }

  /**
   * Generates key representing currently active steps.
   */
  private activeKey() {
    const strings = [...this.activeSteps].map((step) => step.toString()).sort();
    return JSON.stringify(strings);
  }

  /**
   * Removes expired sequence candidates.
   *
   * Candidates expire if they are not continued within
   * `clearDuration` seconds.
   */
  private cleanupCandidates(scope: Scope) {
    const now = Date.now();
    const actionsCandidates = this.scopedCandidates.get(scope);
    if (!actionsCandidates) return;
    for (const [id, { timestamp, clearDuration }] of actionsCandidates) {
      const clearMs = (clearDuration ?? 3) * 1000;
      if (now - timestamp > clearMs) {
        actionsCandidates.delete(id);
      }
    }
  }
}
