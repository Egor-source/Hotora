/**
 * @jest-environment jsdom
 */
import "../__mocks__/IntersectionObserver";
import { hotKeys } from "@hotora/hotkeys";

describe("HotKeys utils", () => {
  let el: HTMLElement;

  beforeEach(() => {
    el = document.createElement("div");
    document.body.appendChild(el);
  });

  it("getDepth should return correct depth", () => {
    const child = document.createElement("div");
    el.appendChild(child);

    const depth = (hotKeys as any).getDepth(child);
    expect(depth).toBe(4);
  });

  it("findClosestRegistered should find nearest parent", () => {
    const parent = document.createElement("div");
    const child = document.createElement("div");
    parent.appendChild(child);
    document.body.appendChild(parent);

    (hotKeys as any).elements.set(parent, "scope");
    const found = (hotKeys as any).findClosestRegistered(child);
    expect(found).toBe(parent);
  });

  it("getScopeChain should include $global", () => {
    (hotKeys as any).elements.set(el, "scope1");
    const chain = (hotKeys as any).getScopeChain(el);
    expect(chain).toContain("scope1");
    expect(chain).toContain("$global");
  });
});
