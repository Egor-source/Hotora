import { MockEventProvider } from "../__mocks__/MockEventProvider";
import { createInputsManager, InputsManager, Keys } from "@hotora/inputs";

describe("InputsManager.register", () => {
  let test: {};
  let manager: InputsManager<MockEventProvider>;
  let provider: MockEventProvider;
  beforeEach(() => {
    provider = new MockEventProvider();
    manager = createInputsManager(provider);
    test = { isConnected: true };
  });

  it("should register an element with scope", () => {
    const id = manager.register(
      [Keys.A],
      { handler: jest.fn() },
      test,
      "scope1",
    );
    expect(typeof id).toBe("string");
  });

  it("should register without element or scope", () => {
    const id = manager.register([Keys.A], { handler: jest.fn() });
    expect(typeof id).toBe("string");
  });

  it("should allow unregistering", () => {
    const id = manager.register(
      [Keys.A],
      { handler: jest.fn() },
      test,
      "scope1",
    );
    manager.unregister(id);
    expect(
      (manager as any).sequenceController.scopedIndexes.get("scope1").has(id),
    ).toBe(false);
  });
});
