import { MockEventProvider } from "../__mocks__/MockEventProvider";
import { createInputsManager, InputsManager, Keys } from "@hotora/inputs";

describe("InputsManager input events", () => {
  let manager: InputsManager<MockEventProvider>;
  let provider: MockEventProvider;

  beforeEach(() => {
    provider = new MockEventProvider();
    manager = createInputsManager(provider);
  });

  it("should call handler on inputStart", () => {
    let test = { isConnected: true };
    const handler = jest.fn();
    manager.register([Keys.A], { handler }, test, "scope1");
    provider.emitObserve([{ target: test, isIntersecting: true }]);

    provider.emitInputStart(Keys.A);

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

    manager.register([Keys.A], { handler: h1 }, child, "s2");
    manager.register([Keys.A], { handler: h2 }, parent, "s1");

    provider.emitObserve([
      { target: parent, isIntersecting: true },
      { target: child, isIntersecting: true },
    ]);
    provider.emitInputStart(Keys.A);

    expect(h1).toHaveBeenCalled();
    expect(h2).not.toHaveBeenCalled();
  });

  it("should remove step on inputEnd", () => {
    const removeStepSpy = jest.spyOn(
      (manager as any).sequenceController,
      "removeStep",
    );
    provider.emitInputStart(Keys.A);
    provider.emitInputEnd(Keys.A);

    expect(removeStepSpy).toHaveBeenCalledWith("KeyA");
  });
});
