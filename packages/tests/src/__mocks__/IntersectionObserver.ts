class MockIntersectionObserver {
  callback: Function;
  constructor(cb: Function) {
    this.callback = cb;
  }

  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();

  trigger(entries: { target: HTMLElement; isIntersecting: boolean }[]) {
    this.callback(entries, this);
  }
}

global.IntersectionObserver = MockIntersectionObserver as any;
