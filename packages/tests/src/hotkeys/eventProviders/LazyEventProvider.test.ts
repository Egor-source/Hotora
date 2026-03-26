import { Keys, LazyEventProvider } from "@hotora/hotkeys";
import { MockEventProvider } from "../../__mocks__/MockEventProvider";

describe("LazyEventProvider", () => {
  test("buffers handlers and replays after init (sync provider)", async () => {
    const mock = new MockEventProvider();
    const provider = new LazyEventProvider(() => mock);

    const keyDown = jest.fn();
    const keyUp = jest.fn();

    const abort = new AbortController();

    provider.onKeyDown(keyDown, abort.signal);
    provider.onKeyUp(keyUp, abort.signal);

    mock.emitKeyDown(Keys.A);
    mock.emitKeyUp(Keys.A);

    expect(keyDown).toHaveBeenCalledWith(Keys.A);
    expect(keyUp).toHaveBeenCalledWith(Keys.A);
  });

  test("works with async factory", async () => {
    const mock = new MockEventProvider();

    const provider = new LazyEventProvider(() => Promise.resolve(mock));

    const handler = jest.fn();
    const abort = new AbortController();

    provider.onKeyDown(handler, abort.signal);

    await Promise.resolve();

    mock.emitKeyDown(Keys.A);

    expect(handler).toHaveBeenCalled();
  });

  test("buffers observe and replays after init", () => {
    const mock = new MockEventProvider();
    const provider = new LazyEventProvider(() => mock);
    (provider as any).init();

    const callback = jest.fn();
    const abort = new AbortController();

    const test = { isConnected: true };

    provider.observe(test, callback, abort.signal);

    mock.emitObserve([{ target: test, isIntersecting: true }]);

    expect(callback).toHaveBeenCalled();
  });

  test("unobserve removes buffered observe before init", () => {
    const mock = new MockEventProvider();
    const provider = new LazyEventProvider(() => mock);

    const callback = jest.fn();
    const abort = new AbortController();

    const test = { isConnected: true };

    provider.observe(test, callback, abort.signal);
    provider.unobserve(test);

    (provider as any).init();

    mock.emitObserve([{ target: test, isIntersecting: true }]);

    expect(callback).not.toHaveBeenCalled();
  });

  test("abort signal removes handlers", () => {
    const mock = new MockEventProvider();
    const provider = new LazyEventProvider(() => mock);

    const handler = jest.fn();
    const abort = new AbortController();

    provider.onKeyDown(handler, abort.signal);

    abort.abort();

    mock.emitKeyDown(Keys.A);

    expect(handler).not.toHaveBeenCalled();
  });

  test("throws if provider resolved to null after init", () => {
    const provider = new LazyEventProvider<any>(() => null);

    const abort = new AbortController();

    provider.onKeyDown(() => {}, abort.signal);

    expect(() => provider.getParentElement({})).toThrow(
      "Provider initialized but not available",
    );
  });

  test("fallback getParentElement before init", () => {
    const provider = new LazyEventProvider<any>(() => null);

    const el = {};

    expect(provider.getParentElement(el)).toBeNull();
  });

  test("fallback getIsElementConnected before init", () => {
    const provider = new LazyEventProvider<any>(() => null);

    const el = { isConnected: true };

    expect(provider.getIsElementConnected(el)).toBe(true);
  });

  test("calls provider methods directly after init", () => {
    const mock = new MockEventProvider();
    const provider = new LazyEventProvider(() => mock);

    const callback = jest.fn();
    const abort = new AbortController();

    const element = {};

    provider.onKeyDown(() => {}, abort.signal);

    provider.observe(element, callback, abort.signal);

    mock.emitObserve([{ target: element, isIntersecting: true }]);

    expect(callback).toHaveBeenCalled();
  });
});
