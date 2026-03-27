import { MockEventProvider } from "../../__mocks__/MockEventProvider";
import { Keys, LazyEventProvider } from "@hotora/inputs";

describe("LazyEventProvider", () => {
  test("buffers handlers and replays after init (sync provider)", async () => {
    const mock = new MockEventProvider();
    const provider = new LazyEventProvider(() => mock);

    const inputStart = jest.fn();
    const inputEnd = jest.fn();

    const abort = new AbortController();

    provider.onInputStart(inputStart, abort.signal);
    provider.onInputEnd(inputEnd, abort.signal);

    mock.emitInputStart(Keys.A);
    mock.emitInputEnd(Keys.A);

    expect(inputStart).toHaveBeenCalledWith(Keys.A);
    expect(inputEnd).toHaveBeenCalledWith(Keys.A);
  });

  test("works with async factory", async () => {
    const mock = new MockEventProvider();

    const provider = new LazyEventProvider(() => Promise.resolve(mock));

    const handler = jest.fn();
    const abort = new AbortController();

    provider.onInputStart(handler, abort.signal);

    await Promise.resolve();

    mock.emitInputStart(Keys.A);

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

    provider.onInputStart(handler, abort.signal);

    abort.abort();

    mock.emitInputStart(Keys.A);

    expect(handler).not.toHaveBeenCalled();
  });

  test("throws if provider resolved to null after init", () => {
    const provider = new LazyEventProvider<any>(() => null);

    const abort = new AbortController();

    provider.onInputStart(() => {}, abort.signal);

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

    provider.onInputStart(() => {}, abort.signal);

    provider.observe(element, callback, abort.signal);

    mock.emitObserve([{ target: element, isIntersecting: true }]);

    expect(callback).toHaveBeenCalled();
  });
});
