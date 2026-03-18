import { SequenceController } from "@hotora/core";

describe("SequenceController - multiple stages", () => {
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

    controller.addStep("A");
    const fired = controller.process();
    expect(fired.length).toBe(2);
    expect(fired.map(([_, cb]) => cb)).toEqual([handler1, handler2]);
  });

  test("should fire handlers only 1 scope", () => {
    const handler1 = jest.fn();
    const handler2 = jest.fn();

    controller.register([["A"]], { handler: handler1 }, "test1");
    controller.register([["A"]], { handler: handler2 }, "test2");

    controller.addStep("A");
    const fired1 = controller.process("test1");
    expect(fired1.length).toBe(1);
    expect(fired1.map(([_, cb]) => cb)).toEqual([handler1]);

    const fired2 = controller.process("test2");
    expect(fired2.length).toBe(1);
    expect(fired2.map(([_, cb]) => cb)).toEqual([handler2]);
  });
});
