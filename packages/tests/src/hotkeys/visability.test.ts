import { createHotKeys, HotKeys, Keys } from "@hotora/hotkeys";
import { MockEventProvider } from "../__mocks__/MockEventProvider";

describe("HotKeys visibility", () => {
  let test: {};
  let hotKeys: HotKeys<MockEventProvider>;
  let provider: MockEventProvider;
  beforeEach(() => {
    provider = new MockEventProvider();
    hotKeys = createHotKeys(provider);
    test = { isConnected: true };
  });

  it("should add element to visibleElements when intersecting", () => {
    hotKeys.register([Keys.A], { handler: jest.fn() }, test, "scope");
    provider.emitObserve([{ target: test, isIntersecting: true }]);
    expect((hotKeys as any).visibleElements.has(test)).toBe(true);
  });

  it("should remove element when not intersecting", () => {
    hotKeys.register([Keys.A], { handler: jest.fn() }, test, "scope");
    provider.emitObserve([{ target: test, isIntersecting: false }]);
    expect((hotKeys as any).visibleElements.has(test)).toBe(false);
  });

  it("should resolve deepest element as active", () => {
    const parent = { isConnected: true };
    const child = { isConnected: true, parentElement: parent };

    hotKeys.register([Keys.A], { handler: jest.fn() }, parent, "parent");
    hotKeys.register([Keys.A], { handler: jest.fn() }, child, "child");

    provider.emitObserve([
      { target: parent, isIntersecting: true },
      { target: child, isIntersecting: true },
    ]);

    const active = (hotKeys as any).resolveActiveElement();
    expect(active).toBe(child);
  });
});
