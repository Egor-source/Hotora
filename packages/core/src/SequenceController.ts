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
export class SequenceController<
  T extends ToString,
  K extends SequenceEvent<T> = SequenceEvent<T>,
> {
  /** Currently active steps (global state). */
  private activeSteps = new Set<T>();
  /**
   * Index of actions grouped by scope.
   *
   * Structure:
   * scope -> actionKey -> ActionIndexEntry[]
   */
  private scopedIndexes = new Map<Scope, ActionIndex<T, K>>();
  /**
   * Current candidates for sequence progression.
   *
   * Stores partial progress of sequences that already matched
   * one or more stages but haven't finished yet.
   *
   * Structure:
   * scope -> actionId -> candidateState
   */
  private scopedCandidates = new Map<Scope, ActionsCandidates>();

  /**
   * Registers a new sequence action.
   *
   * @param sequence A single stage or an ordered sequence of stages.
   * @param setup Action configuration (handler, clearDuration, etc.).
   * @param scope Logical context where this action is active.
   *
   * @returns ActionId that can be used later to unregister the action.
   */
  register(
    sequence: Stage<T> | Stage<T>[],
    setup: Omit<SequenceAction<T, K>, "id" | "sequence">,
    scope: Scope = "$global",
  ): ActionId {
    const id = crypto.randomUUID();
    const normalized = Array.isArray(sequence[0])
      ? (sequence as Sequence<T>)
      : ([sequence] as Sequence<T>);

    if (!normalized[0] || normalized[0].length === 0)
      throw Error("Empty sequence.");

    const action: SequenceAction<T, K> = {
      id,
      sequence: normalized,
      ...setup,
    };

    const actionIndex: ActionIndex<T, K> =
      this.scopedIndexes.get(scope) ?? (new Map() as ActionIndex<T, K>);

    normalized.forEach((stage, index) => {
      const key = this.stageKey(stage);
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
   * Processes the current input state and resolves matching sequences.
   *
   * This method should be called after input steps have been added
   * (e.g. after handling a keydown event via a separate step function).
   *
   * It checks the accumulated steps against registered stages
   * and advances active sequences.
   *
   * @param scope Current execution context
   *
   * @returns Array of [event, handler] tuples to be executed.
   */
  process(scope: Scope = "$global"): Fired<T, K> {
    this.cleanupCandidates(scope);
    const firedToNextStep = new Set<string>();

    const actionIndex = this.scopedIndexes.get(scope);
    if (!actionIndex) return [];

    const key = this.activeKey();

    const actions = actionIndex.get(key);
    if (!actions) return [];

    const actionsCandidates: ActionsCandidates =
      this.scopedCandidates.get(scope) ?? (new Map() as ActionsCandidates);

    const emitActions = actions.filter(({ action, index }) => {
      const stageIndex = actionsCandidates.get(action.id)?.index ?? 0;
      const stage = action.sequence[stageIndex];
      if (!stage || index !== stageIndex || firedToNextStep.has(action.id))
        return false;
      firedToNextStep.add(action.id);

      if (stageIndex === action.sequence.length - 1) {
        actionsCandidates.delete(action.id);
        this.scopedCandidates.set(scope, actionsCandidates);
        return true;
      }

      actionsCandidates.set(action.id, {
        index: stageIndex + 1,
        timestamp: Date.now(),
        clearDuration: action.clearDuration,
      });

      this.scopedCandidates.set(scope, actionsCandidates);

      return false;
    });

    const fired: Fired<T, K> = [];

    for (const { action } of emitActions) {
      fired.push([this.buildEvent(action), action.handler]);
    }

    return fired;
  }

  /**
   * Add step to active steps set.
   *
   * Should be called when input step start
   * (e.g. keydown event).
   * @param step Step to be added
   */
  addStep(step: Step<T>) {
    this.activeSteps.add(step);
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
  private buildEvent(action: SequenceAction<T, K>): K {
    return {
      sequence: action.sequence,
      activeSteps: new Set(this.activeSteps),
      timestamp: Date.now(),
    } as K;
  }

  /**
   * Generates a unique key for a stage.
   *
   * Steps are sorted so stage order doesn't matter.
   */
  private stageKey(stage: Stage<T>) {
    const strings = stage.map((step) => step.toString()).sort();
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
