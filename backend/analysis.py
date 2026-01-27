"""Analysis functions."""
import json
import re
import ast
import textwrap
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from backend.state import get_dataframe
from backend.bots import BOT_DEFINITIONS, normalize_bot_id


def run_analysis(query: str, df: pd.DataFrame, llm, metadata: dict, bot_id: str | None = None) -> str:
    """Run analysis on a query using LLM."""
    # Use ensure_ascii=False to preserve Hebrew/Unicode characters in column names
    rich_context = json.dumps(
        [{item["col"]: item["rich_desc"]} for item in metadata.get("catalog", [])],
        ensure_ascii=False
    )

    plan_prompt = f"""
You are a Strategic Data Analyst.
INDUSTRY: {metadata.get('industry')}
COLUMN CONTEXT: {rich_context}
QUERY: {query}

RULES:
1. Variable name is 'df'. ONLY use 'df'.
2. Use 'pd' and 'np'.
3. If calculating duration: pd.to_datetime() first.
4. Store result in variable 'result'.

Return ONLY JSON: {{"plan": "logic", "python_code": "code"}}
"""
    def _extract_json(text: str) -> dict:
        """Extract the first JSON object from an LLM response."""
        m = re.search(r"\{.*\}", text, re.DOTALL)
        if not m:
            raise ValueError("LLM returned no JSON.")
        return json.loads(m.group())

    def _sanitize_python(code: str) -> str:
        """Normalize LLM python output (strip fences, dedent, strip)."""
        if not isinstance(code, str):
            raise ValueError("python_code must be a string.")

        s = code.strip()

        # Strip markdown fences if present.
        if s.startswith("```"):
            # Remove opening fence line (``` or ```python)
            s = re.sub(r"^```[a-zA-Z0-9_-]*\s*\n", "", s)
            # Remove trailing fence
            s = re.sub(r"\n```$", "", s)

        s = textwrap.dedent(s).strip()
        return s

    def _validate_python(code: str) -> None:
        """Parse Python to catch syntax errors early (e.g., unexpected indent)."""
        ast.parse(code, filename="<analysis_code>", mode="exec")

    exec_scope = {
        "df": df,
        "pd": pd,
        "np": np,
        "datetime": datetime,
        "timedelta": timedelta,
    }

    # Provide a small set of safe builtins for basic operations.
    exec_scope["__builtins__"] = {
        "len": len,
        "sum": sum,
        "min": min,
        "max": max,
        "sorted": sorted,
        "round": round,
        "abs": abs,
        "range": range,
        "enumerate": enumerate,
        "list": list,
        "dict": dict,
        "set": set,
        "tuple": tuple,
        "float": float,
        "int": int,
        "str": str,
        "bool": bool,
    }

    # Plan + execute with self-healing retries on codegen failures.
    max_attempts = 3
    last_exc: Exception | None = None
    last_code: str | None = None

    for attempt in range(max_attempts):
        try:
            if attempt == 0:
                plan_res = llm.invoke(plan_prompt).content
                plan_json = _extract_json(plan_res)
                python_code = plan_json.get("python_code", "")
            else:
                exc = last_exc or RuntimeError("unknown execution error")
                fix_prompt = f"""
You are fixing LLM-generated Python that is executed with:
- df (pandas DataFrame)
- pd (pandas)
- np (numpy)
- datetime, timedelta

The previous code FAILED during execution.

USER QUERY: {query}
INDUSTRY: {metadata.get('industry')}
COLUMN CONTEXT: {rich_context}

ERROR TYPE: {type(exc).__name__}
ERROR MESSAGE: {str(exc)}

PREVIOUS CODE:
{last_code}

RULES:
1. Do NOT import anything.
2. Do NOT define functions/classes.
3. ONLY use df/pd/np/datetime/timedelta.
4. MUST assign the final answer to a variable named result.
5. Return ONLY JSON: {{"python_code": "..."}} (no markdown, no backticks).
""".strip()
                fix_res = llm.invoke(fix_prompt).content
                fix_json = _extract_json(fix_res)
                python_code = fix_json.get("python_code", "")

            code = _sanitize_python(python_code)
            _validate_python(code)
            last_code = code

            # IMPORTANT: use exec_scope as BOTH globals and locals so that
            # names like pd/np remain visible even if the code defines lambdas/functions.
            exec(code, exec_scope, exec_scope)

            if "result" not in exec_scope:
                raise RuntimeError("Generated code did not set `result`.")

            break
        except Exception as e:
            last_exc = e
            # Try again with an error-aware fix prompt
            continue
    else:
        # Exhausted retries
        exc = last_exc or RuntimeError("unknown execution error")
        raise RuntimeError(
            f"Auto-analysis failed after {max_attempts} attempts: {type(exc).__name__}: {exc}"
        )

    res_data = exec_scope.get("result", "No data generated.")

    chosen_bot_id = normalize_bot_id(bot_id)
    bot = BOT_DEFINITIONS[chosen_bot_id]
    explain_prompt = bot.explain_prompt_template.format(
        result=res_data,
        query=query,
        industry=metadata.get("industry"),
    )
    return llm.invoke(explain_prompt).content


def get_metrics(metadata: dict) -> dict:
    """Calculate metrics from the dataframe and metadata."""
    df = get_dataframe()
    if df is None:
        raise ValueError("No dataset loaded. Please load a CSV file first.")
    
    # Dashboard (10th Day Rule) - same logic as app.py
    today = datetime.now()
    target_m, target_y = (
        (today.month, today.year)
        if today.day >= 10
        else (
            (today.replace(day=1) - timedelta(days=1)).month,
            (today.replace(day=1) - timedelta(days=1)).year,
        )
    )

    df_metrics = df
    if metadata.get("primary_date") and metadata["primary_date"] in df.columns:
        df_metrics = df[
            (df[metadata["primary_date"]].dt.month == target_m)
            & (df[metadata["primary_date"]].dt.year == target_y)
        ]
        if df_metrics.empty:
            df_metrics = df

    # Calculate revenue
    revenue = 0.0
    if metadata.get("primary_money") and metadata["primary_money"] in df_metrics.columns:
        col = metadata["primary_money"]
        if df_metrics[col].dtype == "object":
            revenue = (
                df_metrics[col]
                .astype(str)
                .str.replace(r"[^\d.]", "", regex=True)
                .astype(float)
                .sum()
            )
        else:
            revenue = float(df_metrics[col].sum())

    # Calculate volume (row count)
    volume = int(len(df_metrics))

    # Calculate average value
    avg_value = revenue / volume if volume > 0 else 0.0

    return {
        "revenue": float(revenue),
        "volume": volume,
        "avgValue": float(avg_value),
    }
