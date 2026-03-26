/**
 * @jest-environment jsdom
 */

import "../../__mocks__/IntersectionObserver";
import { fireEvent } from "@testing-library/dom";
import { DOMEventProvider } from "@hotora/hotkeys";

describe("DOMEventProvider", () => {
  let provider: DOMEventProvider;

  beforeEach(() => {
    provider = new DOMEventProvider();
  });

  afterEach(() => {
    document.body.innerHTML = "";
    jest.clearAllMocks();
  });

  test("onKeyDown should call handler when key pressed", () => {
    const handler = jest.fn();
    const controller = new AbortController();

    provider.onKeyDown(handler, controller.signal);
    fireEvent.keyDown(document, { code: "KeyA" });

    expect(handler).toHaveBeenCalledWith("KeyA");

    controller.abort();
    fireEvent.keyDown(document, { code: "KeyB" });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  test("onKeyUp should call handler when key released", () => {
    const handler = jest.fn();
    const controller = new AbortController();

    provider.onKeyUp(handler, controller.signal);

    fireEvent.keyUp(document, { code: "KeyA" });

    expect(handler).toHaveBeenCalledWith("KeyA");

    controller.abort();
    fireEvent.keyUp(document, { code: "KeyB" });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  test("onPointer should call handler on mousedown and touchstart", () => {
    const handler = jest.fn();
    const controller = new AbortController();

    provider.onPointer(handler, controller.signal);

    const div = document.createElement("div");
    document.body.appendChild(div);

    fireEvent.mouseDown(div);
    fireEvent.touchStart(div);

    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler).toHaveBeenCalledWith(div);

    controller.abort();
    fireEvent.mouseDown(div);
    expect(handler).toHaveBeenCalledTimes(2);
  });

  test("observe should call handler when element intersects", () => {
    const handler = jest.fn();
    const controller = new AbortController();

    const div = document.createElement("div");
    document.body.appendChild(div);

    provider.observe(div, handler, controller.signal);

    const observer = (provider as any).observer;
    observer.trigger([{ target: div, isIntersecting: true }]);

    expect(handler).toHaveBeenCalledWith([
      { target: div, isIntersecting: true },
    ]);

    controller.abort();
    observer.trigger([{ target: div, isIntersecting: false }]);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  test("unobserve should stop observing element", () => {
    const handler = jest.fn();
    const controller = new AbortController();

    const div = document.createElement("div");
    document.body.appendChild(div);

    provider.observe(div, handler, controller.signal);
    provider.unobserve(div);

    const observer = (provider as any).observer;
    observer.trigger([{ target: div, isIntersecting: false }]);
    expect(handler).not.toHaveBeenCalled();
  });
});
