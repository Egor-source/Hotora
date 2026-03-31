/**
 * @jest-environment jsdom
 */
import React from "react";
import { render } from "@testing-library/react";
import { MockEventProvider } from "../__mocks__/MockEventProvider";
import { Keys } from "@hotora/inputs";
import { HotoraInputsProvider, useHotoraInputs } from "@hotora/react-inputs";

describe("useHotoraInputs - registration", () => {
  test("registers handler when mounted", () => {
    const provider = new MockEventProvider();
    const handler = jest.fn();

    const spy = jest.spyOn(provider, "onInputStart");

    const Test = () => {
      const ref = useHotoraInputs<MockEventProvider>(
        [Keys.A],
        { handler },
        "test",
      );
      return <div ref={ref} />;
    };

    render(
      <HotoraInputsProvider provider={provider}>
        <Test />
      </HotoraInputsProvider>,
    );

    expect(spy).toHaveBeenCalled();
  });

  test("throws if used without provider", () => {
    const Test = () => {
      useHotoraInputs<any>([Keys.A], { handler: jest.fn() } as any);
      return null;
    };

    expect(() => render(<Test />)).toThrow(
      "useInputsManager must be used within an InputsProvider",
    );
  });
});
