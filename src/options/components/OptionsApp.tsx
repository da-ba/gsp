/**
 * Options Page App Component
 */

import React from "react";
import { getOptionsSections } from "../../content/commands/options-registry.ts";

/** Global styles for the options page */
const globalStyles = `
  body {
    font-family: system-ui, sans-serif;
    padding: 18px;
    max-width: 760px;
  }
  h2 {
    margin-bottom: 16px;
  }
`;

export function OptionsApp() {
  const sections = getOptionsSections();

  return (
    <>
      <style>{globalStyles}</style>
      <h2>GitHub Slash Palette</h2>
      <div id="sections">
        {sections.map(({ name, component: Component }) => (
          <Component key={name} />
        ))}
      </div>
    </>
  );
}
