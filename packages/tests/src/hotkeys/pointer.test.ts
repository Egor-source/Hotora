/**
 * @jest-environment jsdom
 */
import "../__mocks__/IntersectionObserver";
import { fireEvent } from "@testing-library/dom";
import { hotKeys, Keys } from "@hotora/hotkeys";

describe("HotKeys pointer events", () => {
  let div: HTMLElement;

  beforeEach(() => {
    div = document.createElement("div");
    document.body.appendChild(div);
    hotKeys.register([Keys.A], { handler: jest.fn() }, div, "scope");
  });

  it("should set active element on mousedown", () => {
    fireEvent.mouseDown(div);
    expect((hotKeys as any).activeElement).toBe(div);
  });

  it("should set active element on touchstart", () => {
    fireEvent.touchStart(div);
    expect((hotKeys as any).activeElement).toBe(div);
  });
});
