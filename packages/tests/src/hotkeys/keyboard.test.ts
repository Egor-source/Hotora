import { createHotKeys, HotKeys, Keys } from "@hotora/hotkeys";
import { MockEventProvider } from "../__mocks__/MockEventProvider";

describe("HotKeys keyboard events", () => {
  let hotKeys: HotKeys<MockEventProvider>;
  let provider: MockEventProvider;

  beforeEach(() => {
    provider = new MockEventProvider();
    hotKeys = createHotKeys(provider);
  });

  it("should call handler on keydown", () => {
    let test = { isConnected: true };
    const handler = jest.fn();
    hotKeys.register([Keys.A], { handler }, test, "scope1");
    provider.emitObserve([{ target: test, isIntersecting: true }]);

    provider.emitKeyDown(Keys.A);

    expect(handler).toHaveBeenCalled();
  });

  it("should stop propagation", () => {
    const h1 = jest.fn(({ stopPropagation }) => stopPropagation());
    const h2 = jest.fn();
    const parent = { isConnected: true };

    const child = {
      isConnected: true,
      parentElement: parent,
    };

    hotKeys.register([Keys.A], { handler: h1 }, child, "s2");
    hotKeys.register([Keys.A], { handler: h2 }, parent, "s1");

    provider.emitObserve([
      { target: parent, isIntersecting: true },
      { target: child, isIntersecting: true },
    ]);
    provider.emitKeyDown(Keys.A);

    expect(h1).toHaveBeenCalled();
    expect(h2).not.toHaveBeenCalled();
  });

  it("should remove step on keyup", () => {
    const removeStepSpy = jest.spyOn(
      (hotKeys as any).sequenceController,
      "removeStep",
    );
    provider.emitKeyDown(Keys.A);
    provider.emitKeyUp(Keys.A);

    expect(removeStepSpy).toHaveBeenCalledWith("KeyA");
  });
});
