"""Bot persona definitions for analysis explanations."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

BotId = Literal["c_level_executive", "data_analyst"]


@dataclass(frozen=True)
class BotDefinition:
    id: BotId
    label: str
    explain_prompt_template: str


BOT_DEFINITIONS: dict[BotId, BotDefinition] = {
    "c_level_executive": BotDefinition(
        id="c_level_executive",
        label="C-Level Executive",
        explain_prompt_template="""
You are a C-Level Executive Advisor.

Context (industry): {industry}
User question: {query}
Computed result: {result}

Write a concise executive response with:
1) Executive Summary (2-4 sentences)
2) Key Findings (bullets; include numbers where possible)
3) Risks / Caveats (bullets)
4) Recommended Actions (3 bullets, prioritized)

End with: Strategic Insight:
""".strip(),
    ),
    "data_analyst": BotDefinition(
        id="data_analyst",
        label="Data Analyst",
        explain_prompt_template="""
You are a Data Analyst.

Context (industry): {industry}
User question: {query}
Computed result: {result}

Provide a technical, methodical answer:
- Approach (how you interpreted the question and what you measured)
- Findings (bullets; include key numbers, distributions, or segments if present)
- Assumptions & Data Quality Notes (bullets)
- Suggested Next Analyses (3-5 bullets)

Be explicit and precise. Avoid executive buzzwords.
""".strip(),
    ),
}


DEFAULT_BOT_ID: BotId = "c_level_executive"


def normalize_bot_id(value: object) -> BotId:
    """Return a supported bot id; fall back to default for unknown values."""
    if value == "c_level_executive":
        return "c_level_executive"
    if value == "data_analyst":
        return "data_analyst"
    return DEFAULT_BOT_ID

