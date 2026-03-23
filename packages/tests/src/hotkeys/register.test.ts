/**
 * @jest-environment jsdom
 */
import "../__mocks__/IntersectionObserver";
import { Keys, hotKeys } from "@hotora/hotkeys";

describe("HotKeys.register", () => {
  let button: HTMLElement;

  beforeEach(() => {
    button = document.createElement("button");
    document.body.appendChild(button);
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("should register an element with scope", () => {
    const id = hotKeys.register(
      [Keys.A],
      { handler: jest.fn() },
      button,
      "scope1",
    );
    expect(typeof id).toBe("string");
  });

  it("should register without element or scope", () => {
    const id = hotKeys.register([Keys.A], { handler: jest.fn() });
    expect(typeof id).toBe("string");
  });

  it("should allow unregistering", () => {
    const id = hotKeys.register(
      [Keys.A],
      { handler: jest.fn() },
      button,
      "scope1",
    );
    hotKeys.unregister(id);
    expect(
      (hotKeys as any).sequenceController.scopedIndexes.get("scope1").has(id),
    ).toBe(false);
  });
});
