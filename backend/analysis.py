"""Analysis functions."""
import json
import re
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
    plan_res = llm.invoke(plan_prompt).content
    plan_json = json.loads(re.search(r"\{.*\}", plan_res, re.DOTALL).group())

    exec_scope = {
        "df": df,
        "pd": pd,
        "np": np,
        "datetime": datetime,
        "timedelta": timedelta,
    }
    exec(plan_json["python_code"], {}, exec_scope)
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
