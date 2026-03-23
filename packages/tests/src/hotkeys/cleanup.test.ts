/**
 * @jest-environment jsdom
 */
import "../__mocks__/IntersectionObserver";
import { hotKeys, Keys } from "@hotora/hotkeys";

describe("HotKeys cleanup", () => {
  let div: HTMLElement;

  beforeEach(() => {
    div = document.createElement("div");
    document.body.appendChild(div);
    hotKeys.register([Keys.A], { handler: jest.fn() }, div, "scope");
    (hotKeys as any).visibleElements.add(div);
    (hotKeys as any).activeElement = div;
  });

  it("should remove disconnected elements", () => {
    div.remove();
    (hotKeys as any).cleanup();

    expect((hotKeys as any).visibleElements.has(div)).toBe(false);
    expect((hotKeys as any).activeElement).toBe(null);
  });
});
