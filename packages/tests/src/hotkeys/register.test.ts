import { createHotKeys, HotKeys, Keys } from "@hotora/hotkeys";
import { MockEventProvider } from "../__mocks__/MockEventProvider";

describe("HotKeys.register", () => {
  let test: {};
  let hotKeys: HotKeys<MockEventProvider>;
  let provider: MockEventProvider;
  beforeEach(() => {
    provider = new MockEventProvider();
    hotKeys = createHotKeys(provider);
    test = { isConnected: true };
  });

  it("should register an element with scope", () => {
    const id = hotKeys.register(
      [Keys.A],
      { handler: jest.fn() },
      test,
      "scope1",
    );
    expect(typeof id).toBe("string");
  });

  it("should register without element or scope", () => {
    const id = hotKeys.register([Keys.A], { handler: jest.fn() });
    expect(typeof id).toBe("string");
  });

  it("should allow unregistering", () => {
    const id = hotKeys.register(
      [Keys.A],
      { handler: jest.fn() },
      test,
      "scope1",
    );
    hotKeys.unregister(id);
    expect(
      (hotKeys as any).sequenceController.scopedIndexes.get("scope1").has(id),
    ).toBe(false);
  });
});
