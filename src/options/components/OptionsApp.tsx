/**
 * Options Page App Component
 */

import React from "react";
import { GiphyOptionsSection } from "./GiphyOptionsSection.tsx";

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
