// Shape mirrors @linhiq/validators slideDeckSchema. Kept local to avoid pulling
// the validators package into the web bundle just for types.

export type EmphasisLevel = "primary" | "accent" | "muted";
export type IconColor = "primary" | "accent" | "success" | "warning" | "danger" | "muted";

export type SlideBlock =
  | { type: "title"; text: string; emphasis?: EmphasisLevel }
  | { type: "subtitle"; text: string }
  | { type: "body"; text: string; size?: "sm" | "md" | "lg" }
  | { type: "bullets" | "list"; items: string[]; style?: "dot" | "check" | "arrow" | "number" }
  | { type: "quote"; text: string; cite?: string }
  | { type: "formula"; latex: string; caption?: string }
  | { type: "icon"; name: string; color?: IconColor }
  | {
      type: "comparison";
      left: { label: string; items: string[] };
      right: { label: string; items: string[] };
    }
  | {
      type: "timeline";
      steps: { label: string; desc?: string; icon?: string }[];
    }
  | { type: "mnemonic"; letters: { char: string; word: string }[] };

export type SlideLayout =
  | "title-cover"
  | "centered"
  | "two-column"
  | "timeline"
  | "comparison"
  | "quote"
  | "mnemonic"
  | "bullets";

export interface Slide {
  layout: SlideLayout;
  background?: "plain" | "gradient-primary" | "gradient-accent" | "pattern-grid";
  blocks: SlideBlock[];
  speakerNotes?: string;
}

export interface SlideDeck {
  title: string;
  language: "vi" | "en" | "mix";
  slides: Slide[];
}
