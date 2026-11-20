"use client";

import type { ChangeEvent, SyntheticEvent } from "react";
import type { CoverDetails } from "@/lib/cover";

const FIELD_SELECTOR = "input, textarea, label";

function stopPageTurn(event: SyntheticEvent) {
  const target = event.target;
  if (target instanceof Element && target.closest(FIELD_SELECTOR)) {
    event.stopPropagation();
  }
}

function bind(values: CoverDetails, key: keyof CoverDetails) {
  return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    values[key] = event.target.value;
  };
}

export function CoverPage({ values }: { values: CoverDetails }) {
  return (
    <form className="cover" onSubmit={(event) => event.preventDefault()}>
      <span className="cover-blob cover-blob-cyan" aria-hidden="true" />
      <span className="cover-blob cover-blob-yellow" aria-hidden="true" />
      <div className="cover-card">
      <p className="kicker">30 days of intentional care</p>
      <h2 className="cover-title">
        Leading from
        <span>The Inside Out</span>
      </h2>
      <p className="cover-subtitle">
        A self-coaching guide
        <span>for doing what matters most</span>
      </p>

      <label className="field">
        Name
        <input
          name="name"
          autoComplete="name"
          placeholder="Your name"
          maxLength={80}
          onChange={bind(values, "name")}
          onMouseDown={stopPageTurn}
          onTouchStart={stopPageTurn}
          onClick={stopPageTurn}
        />
      </label>

      <label className="field">
        Start date
        <input
          name="date"
          type="date"
          onChange={bind(values, "date")}
          onMouseDown={stopPageTurn}
          onTouchStart={stopPageTurn}
          onClick={stopPageTurn}
        />
      </label>

      <label className="field">
        Intention
        <input
          name="intention"
          placeholder="One word"
          maxLength={60}
          onChange={bind(values, "intention")}
          onMouseDown={stopPageTurn}
          onTouchStart={stopPageTurn}
          onClick={stopPageTurn}
        />
      </label>

      <label className="field note">
        Note to yourself
        <textarea
          name="note"
          placeholder="A short note"
          maxLength={400}
          onChange={bind(values, "note")}
          onMouseDown={stopPageTurn}
          onTouchStart={stopPageTurn}
          onClick={stopPageTurn}
        />
      </label>
      </div>
    </form>
  );
}
