import { MockEventProvider } from "../__mocks__/MockEventProvider";
import { createInputsManager, InputsManager, Keys } from "@hotora/inputs";

describe("InputsManager utils", () => {
  let test: {};
  let manager: InputsManager<MockEventProvider>;
  let provider: MockEventProvider;
  beforeEach(() => {
    provider = new MockEventProvider();
    manager = createInputsManager(provider);
    test = { isConnected: true };
  });

  it("getDepth should return correct depth", () => {
    const child = { parentElement: test };

    const depth = (manager as any).getDepth(child);
    expect(depth).toBe(2);
  });

  it("findClosestRegistered should find nearest parent", () => {
    const parent = { isConnected: true };
    const child = { isConnected: true, parentElement: parent };
    const handler = jest.fn();
    manager.register([Keys.A], { handler }, parent, "scope1");

    const found = (manager as any).findClosestRegistered(child);
    expect(found).toBe(parent);
  });

  it("getScopeChain should include $global", () => {
    const handler = jest.fn();
    manager.register([Keys.A], { handler }, test, "scope1");
    const chain = (manager as any).getScopeChain(test);
    expect(chain).toContain("scope1");
    expect(chain).toContain("$global");
  });
});
