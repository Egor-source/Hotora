import { createHotKeys, HotKeys, Keys } from "@hotora/hotkeys";
import { MockEventProvider } from "../__mocks__/MockEventProvider";

describe("HotKeys pointer events", () => {
  let test: {};
  let hotKeys: HotKeys<MockEventProvider>;
  let provider: MockEventProvider;
  beforeEach(() => {
    provider = new MockEventProvider();
    hotKeys = createHotKeys(provider);
    test = { isConnected: true };
    hotKeys.register([Keys.A], { handler: jest.fn() }, test, "scope");
  });

  it("should set active element on emit pointer", () => {
    provider.emitPointer(test);
    expect((hotKeys as any).activeElement).toBe(test);
  });
});
