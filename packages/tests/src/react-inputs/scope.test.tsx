/**
 * @jest-environment jsdom
 */

import React from "react";
import { render } from "@testing-library/react";
import { MockEventProvider } from "../__mocks__/MockEventProvider";
import { Keys } from "@hotora/inputs";
import { HotoraInputsProvider, HotoraScope } from "@hotora/react-inputs";

describe("HotoraScope", () => {
  test("triggers handler once", () => {
    const provider = new MockEventProvider();
    const handler = jest.fn();

    render(
      <HotoraInputsProvider provider={provider}>
        <HotoraScope sequence={[Keys.A]} setup={{ handler }}>
          <div />
        </HotoraScope>
      </HotoraInputsProvider>,
    );

    const node = document.querySelector("[data-scope]")!;
    provider.emitObserve([{ target: node, isIntersecting: true }]);

    provider.emitInputStart(Keys.A);

    expect(handler).toHaveBeenCalledTimes(1);
  });
  test("isolates scopes", () => {
    const provider = new MockEventProvider();

    const handlerA = jest.fn();
    const handlerB = jest.fn();

    render(
      <HotoraInputsProvider provider={provider}>
        <HotoraScope sequence={[Keys.A]} setup={{ handler: handlerA }}>
          <div />
        </HotoraScope>

        <HotoraScope sequence={[Keys.A]} setup={{ handler: handlerB }}>
          <div />
        </HotoraScope>
      </HotoraInputsProvider>,
    );

    const nodes = document.querySelectorAll("[data-scope]")!;
    provider.emitObserve(
      [...nodes].map((node) => ({ target: node, isIntersecting: true })),
    );
    provider.emitPointer(nodes[1]);
    provider.emitInputStart(Keys.A);

    expect(handlerA).not.toHaveBeenCalled();
    expect(handlerB).toHaveBeenCalledTimes(1);
  });
  test("nested scopes", () => {
    const provider = new MockEventProvider();

    const handlerA = jest.fn();
    const handlerB = jest.fn();

    render(
      <HotoraInputsProvider provider={provider}>
        <HotoraScope sequence={[Keys.A]} setup={{ handler: handlerA }}>
          <HotoraScope sequence={[Keys.A]} setup={{ handler: handlerB }}>
            <div />
          </HotoraScope>
        </HotoraScope>
      </HotoraInputsProvider>,
    );

    const nodes = document.querySelectorAll("[data-scope]")!;
    provider.emitObserve(
      [...nodes].map((node) => ({ target: node, isIntersecting: true })),
    );
    provider.emitInputStart(Keys.A);

    expect(handlerA).toHaveBeenCalledTimes(1);
    expect(handlerB).toHaveBeenCalledTimes(1);
  });
});
