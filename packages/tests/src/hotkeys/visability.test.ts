/**
 * @jest-environment jsdom
 */
import "../__mocks__/IntersectionObserver";
import { hotKeys, Keys } from "@hotora/hotkeys";

describe("HotKeys visibility", () => {
  let div: HTMLElement;

  beforeEach(() => {
    div = document.createElement("div");
    document.body.appendChild(div);
  });

  it("should add element to visibleElements when intersecting", () => {
    hotKeys.register([Keys.A], { handler: jest.fn() }, div, "scope");
    const observer = (hotKeys as any).observer;
    observer.trigger([{ target: div, isIntersecting: true }]);
    expect((hotKeys as any).visibleElements.has(div)).toBe(true);
  });

  it("should remove element when not intersecting", () => {
    hotKeys.register([Keys.A], { handler: jest.fn() }, div, "scope");
    const observer = (hotKeys as any).observer;
    observer.trigger([{ target: div, isIntersecting: false }]);
    expect((hotKeys as any).visibleElements.has(div)).toBe(false);
  });

  it("should resolve deepest element as active", () => {
    const parent = document.createElement("div");
    const child = document.createElement("div");
    parent.appendChild(child);
    document.body.appendChild(parent);

    hotKeys.register([Keys.A], { handler: jest.fn() }, parent, "parent");
    hotKeys.register([Keys.A], { handler: jest.fn() }, child, "child");

    const observer = (hotKeys as any).observer;
    observer.trigger([{ target: parent, isIntersecting: true }]);
    observer.trigger([{ target: child, isIntersecting: true }]);

    const active = (hotKeys as any).resolveActiveElement();
    expect(active).toBe(child);
  });
});
