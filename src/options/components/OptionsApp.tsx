/**
 * Options Page App Component
 */

import React from "react";
import { GiphyOptionsSection } from "../../content/commands/giphy/index.ts";

export function OptionsApp() {
  return (
    <div>
      <h2>GitHub Slash Palette</h2>
      <div id="sections">
        <GiphyOptionsSection />
      </div>
    </div>
  );
}
