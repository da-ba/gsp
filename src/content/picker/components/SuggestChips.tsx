/**
 * Suggest Chips Component
 */

import React from "react";
import { getBadgeStyles } from "../styles.ts";

interface SuggestChipsProps {
  items: string[];
  title: string;
  onPick: (term: string) => void;
}

export function SuggestChips({ items, title, onPick }: SuggestChipsProps) {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const badgeStyles = getBadgeStyles();

  if (!items.length) return null;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "6px",
        marginBottom: "10px",
      }}
    >
      {title && (
        <div
          style={{
            width: "100%",
            opacity: 0.72,
            fontSize: "12px",
            marginBottom: "4px",
          }}
        >
          {title}
        </div>
      )}
      {items.slice(0, 8).map((term, idx) => (
        <button
          key={term}
          type="button"
          data-suggest-chip="true"
          onClick={(ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            onPick(term);
          }}
          onMouseEnter={() => setHoveredIndex(idx)}
          onMouseLeave={() => setHoveredIndex(null)}
          style={{
            ...(badgeStyles as React.CSSProperties),
            cursor: "pointer",
            padding: "6px 10px",
            transform: hoveredIndex === idx ? "scale(1.03)" : "scale(1)",
          }}
        >
          {term}
        </button>
      ))}
    </div>
  );
}
