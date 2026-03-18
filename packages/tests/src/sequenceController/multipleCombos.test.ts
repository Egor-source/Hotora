import { SequenceController } from "@hotora/core";

describe("SequenceController - multiple combos", () => {
  type Step = string;
  let controller: SequenceController<Step>;

  beforeEach(() => {
    controller = new SequenceController<Step>();
  });

  test("should fire multiple handlers for same step", () => {
    const handler1 = jest.fn();
    const handler2 = jest.fn();

    controller.register([["A"]], { handler: handler1 });
    controller.register([["A"]], { handler: handler2 });

    const fired = controller.emitStep("A");
    expect(fired.length).toBe(2);
    expect(fired.map(([_, cb]) => cb)).toEqual([handler1, handler2]);
  });
});
