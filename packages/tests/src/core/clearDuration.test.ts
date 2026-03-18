import { SequenceController } from "@hotora/core";
describe("SequenceController - clearDuration", () => {
  type Step = string;
  let controller: SequenceController<Step>;

  beforeEach(() => {
    controller = new SequenceController<Step>();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("should reset candidate after clearDuration", () => {
    const handler = jest.fn();
    controller.register([["A"], ["B"]], { handler, clearDuration: 0.1 });

    controller.addStep("A");
    jest.advanceTimersByTime(150);

    controller.addStep("B");
    const fired = controller.process();
    expect(fired.length).toBe(0);
  });
});
