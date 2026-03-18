import { SequenceController } from "@hotora/core";

describe("SequenceController - emitStep", () => {
  type Step = string;
  let controller: SequenceController<Step>;

  beforeEach(() => {
    controller = new SequenceController<Step>();
  });

  test("should emit single-step combo", () => {
    const handler = jest.fn();
    controller.register([["A"]], { handler });

    const fired = controller.emitStep("A");

    expect(fired.length).toBe(1);
    expect(fired[0][1]).toBe(handler);
    expect(fired[0][0].activeSteps.has("A")).toBe(true);
  });

  test("should emit multi-step sequence", () => {
    const handler = jest.fn();
    controller.register([["A"], ["B"]], { handler });

    expect(controller.emitStep("A")).toEqual([]);
    controller.removeStep("A");
    const fired = controller.emitStep("B");
    expect(fired.length).toBe(1);
    expect(fired[0][1]).toBe(handler);
  });
});
