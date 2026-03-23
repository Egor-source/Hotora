/**
 * @jest-environment jsdom
 */
import "../__mocks__/IntersectionObserver";
import { fireEvent } from "@testing-library/dom";
import { Keys, hotKeys } from "@hotora/hotkeys";

describe("HotKeys keyboard events", () => {
  let button: HTMLElement;

  beforeEach(() => {
    button = document.createElement("button");
    document.body.appendChild(button);
    (hotKeys as any).visibleElements.add(button);
  });

  it("should call handler on keydown", () => {
    const handler = jest.fn();
    hotKeys.register([Keys.A], { handler }, button, "scope1");

    fireEvent.keyDown(document, { code: "KeyA" });
    expect(handler).toHaveBeenCalled();
  });

  it("should stop propagation", () => {
    const h1 = jest.fn(({ stopPropagation }) => stopPropagation());
    const h2 = jest.fn();
    const parent = document.createElement("div");
    const child = document.createElement("div");
    parent.appendChild(child);
    document.body.appendChild(parent);

    hotKeys.register([Keys.A], { handler: h1 }, child, "s2");
    hotKeys.register([Keys.A], { handler: h2 }, parent, "s1");

    (hotKeys as any).visibleElements.add(parent);
    (hotKeys as any).visibleElements.add(child);

    fireEvent.keyDown(document, { code: "KeyA" });

    expect(h1).toHaveBeenCalled();
    expect(h2).not.toHaveBeenCalled();
  });

  it("should remove step on keyup", () => {
    const removeStepSpy = jest.spyOn(
      (hotKeys as any).sequenceController,
      "removeStep",
    );
    fireEvent.keyDown(document, { code: "KeyA" });
    fireEvent.keyUp(document, { code: "KeyA" });
    expect(removeStepSpy).toHaveBeenCalledWith("KeyA");
  });
});
