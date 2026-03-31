/**
 * @jest-environment jsdom
 */

import React, { useContext } from "react";
import { render, screen } from "@testing-library/react";
import { MockEventProvider } from "../__mocks__/MockEventProvider";
import { getInputContext, HotoraInputsProvider } from "@hotora/react-inputs";
import { createInputsManager, InputsManager } from "@hotora/inputs";

describe("InputsProvider - context", () => {
  test("provides manager to children", () => {
    const provider = new MockEventProvider();
    const Context = getInputContext();

    const Test = () => {
      const manager = useContext(Context as any);
      return <div data-testid="value">{manager ? "ok" : "fail"}</div>;
    };

    render(
      <HotoraInputsProvider provider={provider}>
        <Test />
      </HotoraInputsProvider>,
    );
    const div = screen.getByTestId("value");
    expect(div.textContent).toBe("ok");
  });

  test("uses external manager if provided", () => {
    const Context = getInputContext();

    const externalManager = createInputsManager(new MockEventProvider());

    const Test = () => {
      const manager = useContext(Context as any);
      return (
        <div data-testid="value">
          {manager === externalManager ? "ok" : "fail"}
        </div>
      );
    };

    render(
      <HotoraInputsProvider manager={externalManager}>
        <Test />
      </HotoraInputsProvider>,
    );

    const div = screen.getByTestId("value");
    expect(div.textContent).toBe("ok");
  });
});
