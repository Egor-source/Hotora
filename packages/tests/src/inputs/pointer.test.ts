import { MockEventProvider } from "../__mocks__/MockEventProvider";
import { createInputsManager, InputsManager, Keys } from "@hotora/inputs";

describe("InputsManager pointer events", () => {
  let test: {};
  let manager: InputsManager<MockEventProvider>;
  let provider: MockEventProvider;
  beforeEach(() => {
    provider = new MockEventProvider();
    manager = createInputsManager(provider);
    test = { isConnected: true };
    manager.register([Keys.A], { handler: jest.fn() }, test, "scope");
  });

  it("should set active element on emit pointer", () => {
    provider.emitPointer(test);
    expect((manager as any).activeElement).toBe(test);
  });
});
