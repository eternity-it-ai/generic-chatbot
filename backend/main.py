import sys, json, re, io, base64
from datetime import datetime, timedelta

import pandas as pd
import numpy as np

# If you keep langchain:
try:
    from langchain_openai import ChatOpenAI
    from langchain_google_genai import ChatGoogleGenerativeAI
    GEMINI_AVAILABLE = True
except ImportError as e:
    import sys
    print(f"Warning: Could not import langchain_google_genai: {e}", file=sys.stderr)
    from langchain_openai import ChatOpenAI
    GEMINI_AVAILABLE = False

STATE = {
    "df": None,
    "metadata": None,
    "loaded_name": None,
}


def _get_llm(model: str, api_key: str):
    """Factory function to get the appropriate LLM based on model name."""
    if model.startswith("gemini"):
        if not GEMINI_AVAILABLE:
            raise ValueError("Gemini models are not available. Please install langchain-google-genai.")
        return ChatGoogleGenerativeAI(temperature=0, model=model, google_api_key=api_key)
    else:
        return ChatOpenAI(temperature=0, model=model, openai_api_key=api_key)


def _reply(ok: bool, result=None, error: str | None = None):
    out = {"ok": ok}
    if ok:
        out["result"] = result
    else:
        out["error"] = error or "unknown error"
    sys.stdout.write(json.dumps(out) + "\n")
    sys.stdout.flush()


def generate_metadata(df: pd.DataFrame, llm) -> dict | None:
    col_summary = []
    for c in df.columns:
        sample_vals = df[c].dropna().unique()[:3].tolist()
        col_summary.append(
            {"col_name": c, "dtype": str(df[c].dtype), "sample_values": sample_vals}
        )

    prompt = f"""
Act as a Senior Business Consultant.
Analyze dataset structure: {json.dumps(col_summary)}

GOAL: Create a 'Rich Business Metadata Catalog'.

INSTRUCTIONS:
- Give strategic descriptions (e.g., "The transactional timestamp, critical for seasonal revenue").
- Avoid technical jargon.

TASKS:
1. Identify Industry (Logistics, Auto, Medical).
2. Map Key Roles: primary_date_col, primary_money_col, entity_col (Driver/Rep/Doctor).
3. Create 'catalog' with 'rich_desc'.
4. Calculate 'health_score' (0-100).
5. Generate 3 key statistics from the dataset. Each statistic should have:
   - A clear, business-focused label (e.g., "Total Revenue", "Growth Rate", "Average Transaction Value")
   - A numeric value (can be a float or integer)
   - An optional 'is_percentage' flag (true if the value should be displayed as a percentage, false otherwise)
   - Examples: {{"label": "Total Revenue", "value": 125000.50, "is_percentage": false}}, {{"label": "Growth Rate", "value": 15.5, "is_percentage": true}}

Return ONLY JSON:
{{
  "industry": "str",
  "primary_date": "str",
  "primary_money": "str",
  "entity_col": "str",
  "health_score": int,
  "health_advice": "str",
  "catalog": [
    {{"col": "name", "rich_desc": "Strategic description..."}}
  ],
  "statistics": [
    {{"label": "str", "value": float, "is_percentage": bool}},
    {{"label": "str", "value": float, "is_percentage": bool}},
    {{"label": "str", "value": float, "is_percentage": bool}}
  ]
}}
"""
    try:
        res = llm.invoke(prompt).content
        return json.loads(re.search(r"\{.*\}", res, re.DOTALL).group())
    except:
        return None


def run_analysis(query: str, df: pd.DataFrame, llm, metadata: dict) -> str:
    rich_context = json.dumps(
        [{item["col"]: item["rich_desc"]} for item in metadata.get("catalog", [])]
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

    explain_prompt = f"""
Result: {res_data}
Query: {query}
Context: {metadata.get('industry')}.

Explain as a C-Level Executive summary. Use the business context.
End with 'Strategic Insight:'.
"""
    return llm.invoke(explain_prompt).content


def cmd_load_csv(payload: dict):
    # Accept base64 CSV bytes from the frontend
    b64 = payload.get("csv_base64")
    if not b64:
        raise ValueError("csv_base64 is required")

    raw = base64.b64decode(b64)
    df = pd.read_csv(io.BytesIO(raw))
    df.columns = df.columns.str.strip().str.replace(" ", "_")

    STATE["df"] = df
    STATE["metadata"] = None

    return {
        "rows": int(df.shape[0]),
        "cols": int(df.shape[1]),
        "columns": list(df.columns),
    }


def cmd_generate_metadata(payload: dict):
    if STATE["df"] is None:
        raise ValueError("No dataset loaded. Call load_csv first.")

    api_key = payload.get("openai_api_key")
    model = payload.get("model", "gpt-4o")
    if not api_key:
        raise ValueError("openai_api_key is required")

    llm = _get_llm(model, api_key)
    md = generate_metadata(STATE["df"], llm)
    if not md:
        raise RuntimeError("Failed to generate metadata")

    # optional preprocessing
    if md.get("primary_date") and md["primary_date"] in STATE["df"].columns:
        STATE["df"][md["primary_date"]] = pd.to_datetime(
            STATE["df"][md["primary_date"]], errors="coerce"
        )

    STATE["metadata"] = md
    return md


def cmd_get_metrics(payload: dict):
    if STATE["df"] is None:
        raise ValueError("No dataset loaded. Call load_csv first.")
    if STATE["metadata"] is None:
        raise ValueError("No metadata yet. Call generate_metadata first.")

    df = STATE["df"]
    metadata = STATE["metadata"]
    
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


def cmd_run_analysis(payload: dict):
    if STATE["df"] is None:
        raise ValueError("No dataset loaded. Call load_csv first.")
    if STATE["metadata"] is None:
        raise ValueError("No metadata yet. Call generate_metadata first.")

    api_key = payload.get("openai_api_key")
    model = payload.get("model", "gpt-4o")
    query = payload.get("query")
    if not api_key:
        raise ValueError("openai_api_key is required")
    if not query:
        raise ValueError("query is required")

    llm = _get_llm(model, api_key)
    answer = run_analysis(query, STATE["df"], llm, STATE["metadata"])
    return {"answer": answer}


def handle(msg: dict):
    cmd = msg.get("cmd")
    payload = msg.get("payload", {})

    if cmd == "ping":
        return "pong"
    if cmd == "load_csv":
        return cmd_load_csv(payload)
    if cmd == "generate_metadata":
        return cmd_generate_metadata(payload)
    if cmd == "get_metrics":
        return cmd_get_metrics(payload)
    if cmd == "run_analysis":
        return cmd_run_analysis(payload)

    raise ValueError(f"Unknown cmd: {cmd}")


def main():
    import sys
    print("Backend started", file=sys.stderr, flush=True)
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            msg = json.loads(line)
            result = handle(msg)
            _reply(True, result=result)
        except Exception as e:
            import traceback
            error_msg = str(e)
            traceback_str = traceback.format_exc()
            print(f"Backend error: {error_msg}\n{traceback_str}", file=sys.stderr, flush=True)
            _reply(False, error=error_msg)


if __name__ == "__main__":
    main()
