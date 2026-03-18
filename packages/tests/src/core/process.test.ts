import { SequenceController } from "@hotora/core";

describe("SequenceController - process", () => {
  type Step = string;
  let controller: SequenceController<Step>;

  beforeEach(() => {
    controller = new SequenceController<Step>();
  });

  test("should emit single-step stage", () => {
    const handler = jest.fn();
    controller.register([["A"]], { handler });
    controller.addStep("A");

    const fired = controller.process();

    expect(fired.length).toBe(1);
    expect(fired[0][1]).toBe(handler);
    expect(fired[0][0].activeSteps.has("A")).toBe(true);
  });

  test("should emit multi-step sequence", () => {
    const handler = jest.fn();
    controller.register([["A"], ["B"]], { handler });

    controller.addStep("A");

    expect(controller.process()).toEqual([]);
    controller.removeStep("A");
    controller.addStep("B");
    const fired = controller.process();
    expect(fired.length).toBe(1);
    expect(fired[0][1]).toBe(handler);
  });
});
