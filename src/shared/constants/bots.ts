export const BOT_IDS = ["c_level_executive", "data_analyst"] as const;

export type BotId = (typeof BOT_IDS)[number];

export type BotDefinition = {
  id: BotId;
  label: string;
  description: string;
  icon: "briefcase" | "chart";
  inputPlaceholder: string;
};

export const DEFAULT_BOT_ID: BotId = "c_level_executive";

export const BOT_DEFINITIONS: Record<BotId, BotDefinition> = {
  c_level_executive: {
    id: "c_level_executive",
    label: "C‑Level Executive",
    description: "Brief, decision-oriented insights with risks and next actions.",
    icon: "briefcase",
    inputPlaceholder: "Ask for an executive summary...",
  },
  data_analyst: {
    id: "data_analyst",
    label: "Data Analyst",
    description: "More technical, methodical analysis with assumptions and follow-ups.",
    icon: "chart",
    inputPlaceholder: "Ask for analysis (metrics, breakdowns, methodology)...",
  },
};

