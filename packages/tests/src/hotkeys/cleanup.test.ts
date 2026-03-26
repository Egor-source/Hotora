import { createHotKeys, HotKeys, Keys } from "@hotora/hotkeys";
import { MockEventProvider } from "../__mocks__/MockEventProvider";

describe("HotKeys cleanup with MockEventProvider", () => {
  let hotKeys: HotKeys<MockEventProvider>;
  let provider: MockEventProvider;
  let test;

  beforeEach(() => {
    provider = new MockEventProvider();
    hotKeys = createHotKeys(provider);
    test = { isConnected: true };
    hotKeys.register([Keys.A], { handler: jest.fn() }, test, "scope");
    provider.emitObserve([{ target: test, isIntersecting: true }]);
    provider.emitPointer(test);
  });

  it("should remove disconnected elements", () => {
    test.isConnected = false;
    const cleanup = jest.spyOn(hotKeys, "cleanup");
    provider.emitObserve([]);
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect((hotKeys as any).visibleElements.has(test)).toBe(false);
    expect((hotKeys as any).activeElement).toBe(null);
  });
});
