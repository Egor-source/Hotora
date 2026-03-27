import { MockEventProvider } from "../__mocks__/MockEventProvider";
import { createInputsManager, InputsManager, Keys } from "@hotora/inputs";

describe("InputsManager cleanup with MockEventProvider", () => {
  let manager: InputsManager<MockEventProvider>;
  let provider: MockEventProvider;
  let test;

  beforeEach(() => {
    provider = new MockEventProvider();
    manager = createInputsManager(provider);
    test = { isConnected: true };
    manager.register([Keys.A], { handler: jest.fn() }, test, "scope");
    provider.emitObserve([{ target: test, isIntersecting: true }]);
    provider.emitPointer(test);
  });

  it("should remove disconnected elements", () => {
    test.isConnected = false;
    const cleanup = jest.spyOn(manager, "cleanup");
    provider.emitObserve([]);
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect((manager as any).visibleElements.has(test)).toBe(false);
    expect((manager as any).activeElement).toBe(null);
  });
});
