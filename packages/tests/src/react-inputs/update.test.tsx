/**
 * @jest-environment jsdom
 */

import React, { useCallback } from "react";
import { render } from "@testing-library/react";
import { MockEventProvider } from "../__mocks__/MockEventProvider";
import { Keys } from "@hotora/inputs";
import { HotoraInputsProvider, useHotoraInputs } from "@hotora/react-inputs";

describe("useHotoraInputs - updates", () => {
  test("does not duplicate global listeners on rerender", () => {
    const provider = new MockEventProvider();
    const handler = jest.fn();

    const Test = ({ value }: any) => {
      useHotoraInputs<MockEventProvider>([Keys.A], { handler });
      return <div data-value={value} />;
    };

    const { rerender } = render(
      <HotoraInputsProvider provider={provider}>
        <Test value={1} />
      </HotoraInputsProvider>,
    );

    rerender(
      <HotoraInputsProvider provider={provider}>
        <Test value={2} />
      </HotoraInputsProvider>,
    );

    provider.emitInputStart(Keys.A);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  test("does not duplicate listeners on rerender", () => {
    const provider = new MockEventProvider();
    const handler = jest.fn();

    const Test = ({ value }: any) => {
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
      return <div ref={mockRef} data-value={value} />;
    };

    const { rerender } = render(
      <HotoraInputsProvider provider={provider}>
        <Test value={1} />
      </HotoraInputsProvider>,
    );

    rerender(
      <HotoraInputsProvider provider={provider}>
        <Test value={2} />
      </HotoraInputsProvider>,
    );

    provider.emitInputStart(Keys.A);
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
