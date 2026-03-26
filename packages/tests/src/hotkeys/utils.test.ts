import { createHotKeys, HotKeys, Keys } from "@hotora/hotkeys";
import { MockEventProvider } from "../__mocks__/MockEventProvider";

describe("HotKeys utils", () => {
  let test: {};
  let hotKeys: HotKeys<MockEventProvider>;
  let provider: MockEventProvider;
  beforeEach(() => {
    provider = new MockEventProvider();
    hotKeys = createHotKeys(provider);
    test = { isConnected: true };
  });

  it("getDepth should return correct depth", () => {
    const child = { parentElement: test };

    const depth = (hotKeys as any).getDepth(child);
    expect(depth).toBe(2);
  });

  it("findClosestRegistered should find nearest parent", () => {
    const parent = { isConnected: true };
    const child = { isConnected: true, parentElement: parent };
    const handler = jest.fn();
    hotKeys.register([Keys.A], { handler }, parent, "scope1");

    const found = (hotKeys as any).findClosestRegistered(child);
    expect(found).toBe(parent);
  });

  it("getScopeChain should include $global", () => {
    const handler = jest.fn();
    hotKeys.register([Keys.A], { handler }, test, "scope1");
    const chain = (hotKeys as any).getScopeChain(test);
    expect(chain).toContain("scope1");
    expect(chain).toContain("$global");
  });
});
