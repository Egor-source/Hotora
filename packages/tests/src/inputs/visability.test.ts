import { MockEventProvider } from "../__mocks__/MockEventProvider";
import { createInputsManager, InputsManager, Keys } from "@hotora/inputs";

describe("InputsManager visibility", () => {
  let test: {};
  let manager: InputsManager<MockEventProvider>;
  let provider: MockEventProvider;
  beforeEach(() => {
    provider = new MockEventProvider();
    manager = createInputsManager(provider);
    test = { isConnected: true };
  });

  it("should add element to visibleElements when intersecting", () => {
    manager.register([Keys.A], { handler: jest.fn() }, test, "scope");
    provider.emitObserve([{ target: test, isIntersecting: true }]);
    expect((manager as any).visibleElements.has(test)).toBe(true);
  });

  it("should remove element when not intersecting", () => {
    manager.register([Keys.A], { handler: jest.fn() }, test, "scope");
    provider.emitObserve([{ target: test, isIntersecting: false }]);
    expect((manager as any).visibleElements.has(test)).toBe(false);
  });

  it("should resolve deepest element as active", () => {
    const parent = { isConnected: true };
    const child = { isConnected: true, parentElement: parent };

    manager.register([Keys.A], { handler: jest.fn() }, parent, "parent");
    manager.register([Keys.A], { handler: jest.fn() }, child, "child");

    provider.emitObserve([
      { target: parent, isIntersecting: true },
      { target: child, isIntersecting: true },
    ]);

    const active = (manager as any).resolveActiveElement();
    expect(active).toBe(child);
  });
});
