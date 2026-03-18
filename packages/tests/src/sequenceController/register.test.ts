import { SequenceController } from "@hotora/core";

describe("SequenceController - registration", () => {
  type Step = string;
  let controller: SequenceController<Step>;

  beforeEach(() => {
    controller = new SequenceController<Step>();
  });

  test("should register a combo and return a valid action id", () => {
    const handler = jest.fn();
    const id = controller.register([["A"]], { handler });
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  test("should throw error on empty sequence", () => {
    const handler = jest.fn();
    expect(() => controller.register([[]], { handler })).toThrow(
      "Empty sequence.",
    );
  });
});
