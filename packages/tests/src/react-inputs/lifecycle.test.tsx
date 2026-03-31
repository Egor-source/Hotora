/**
 * @jest-environment jsdom
 */

import React, { useCallback } from "react";
import { render } from "@testing-library/react";
import { MockEventProvider } from "../__mocks__/MockEventProvider";
import { Keys } from "@hotora/inputs";
import { HotoraInputsProvider, useHotoraInputs } from "@hotora/react-inputs";

describe("useHotoraInputs - lifecycle", () => {
  test("unregisters on unmount (via AbortSignal)", () => {
    const provider = new MockEventProvider();
    const handler = jest.fn();

    const Test = () => {
      const ref = useHotoraInputs<MockEventProvider>(
        [Keys.A],
        { handler },
        "test",
      );
      const mockRef = useCallback((node) => {
        ref(node);
        if (node) {
          provider.emitObserve([{ target: node, isIntersecting: true }]);
        }
      }, []);
      return <div ref={mockRef} />;
    };

    const { unmount } = render(
      <HotoraInputsProvider provider={provider}>
        <Test />
      </HotoraInputsProvider>,
    );

    const spy = jest.spyOn(provider, "onInputStart");

    unmount();

    provider.emitInputStart(Keys.A);

    expect(handler).not.toHaveBeenCalled();

    expect(spy).not.toHaveBeenCalled();
  });
});
