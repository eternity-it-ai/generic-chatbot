"""Metadata generation functions."""

import json
import re
import pandas as pd
from datetime import datetime, timedelta
from backend.state import get_dataframe


def generate_metadata(df: pd.DataFrame, llm) -> dict | None:
    """Generate metadata for a dataframe using LLM."""
    col_summary = []
    for c in df.columns:
        sample_vals = df[c].dropna().unique()[:3].tolist()
        col_summary.append(
            {"col_name": c, "dtype": str(df[c].dtype), "sample_values": sample_vals}
        )

    prompt = f"""
Act as a Senior Business Consultant.
Analyze dataset structure: {json.dumps(col_summary, ensure_ascii=False)}

GOAL: Create a 'Rich Business Metadata Catalog'.

INSTRUCTIONS:
- Give strategic descriptions (e.g., "The transactional timestamp, critical for seasonal revenue").
- Avoid technical jargon.

TASKS:
1. Identify Industry (Logistics, Auto, Medical).
2. Map Key Roles: primary_date_col, primary_money_col, entity_col (Driver/Rep/Doctor).
3. Create 'catalog' with 'rich_desc'.
4. Calculate 'health_score' (0-100).
5. Suggest 3 key statistics to calculate from the actual data. For each statistic, specify:
   - A clear, business-focused label (e.g., "Total Revenue", "Average Transaction Value", "Unique Customers")
   - The column name to use for calculation
   - The operation to perform: "sum", "mean", "count", "nunique", "min", "max", "median", or "percentage" (for percentage calculations)
   - Whether the result should be displayed as a percentage (is_percentage: true/false)

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
  "statistics_suggestions": [
    {{"label": "str", "column": "str", "operation": "str", "is_percentage": bool}},
    {{"label": "str", "column": "str", "operation": "str", "is_percentage": bool}},
    {{"label": "str", "column": "str", "operation": "str", "is_percentage": bool}}
  ]
}}
"""
    try:
        res = llm.invoke(prompt).content
        return json.loads(re.search(r"\{.*\}", res, re.DOTALL).group())
    except:
        return None


def calculate_statistics(df: pd.DataFrame, metadata: dict) -> list[dict]:
    """Calculate statistics from the dataframe based on AI suggestions in metadata."""
    statistics = []
    suggestions = metadata.get("statistics_suggestions", [])

    # If no suggestions from AI, provide fallback statistics
    if not suggestions or len(suggestions) == 0:
        # Fallback: calculate basic statistics
        total_records = len(df)
        statistics.append(
            {
                "label": "Total Records",
                "value": float(total_records),
                "is_percentage": False,
            }
        )

        # Try to find a numeric column for sum/mean
        numeric_cols = df.select_dtypes(include=["number"]).columns.tolist()
        if numeric_cols:
            col = df[numeric_cols[0]]
            col_data = col.dropna()
            if len(col_data) > 0:
                statistics.append(
                    {
                        "label": f"Total {numeric_cols[0].replace('_', ' ').title()}",
                        "value": float(col_data.sum()),
                        "is_percentage": False,
                    }
                )
                if len(statistics) < 3:
                    statistics.append(
                        {
                            "label": f"Average {numeric_cols[0].replace('_', ' ').title()}",
                            "value": float(col_data.mean()),
                            "is_percentage": False,
                        }
                    )

        # Fill remaining slots
        while len(statistics) < 3:
            if len(statistics) == 1:
                statistics.append(
                    {
                        "label": "Total Columns",
                        "value": float(len(df.columns)),
                        "is_percentage": False,
                    }
                )
            elif len(statistics) == 2:
                total_cells = len(df) * len(df.columns)
                non_null_cells = df.notna().sum().sum()
                completeness = (
                    (non_null_cells / total_cells * 100) if total_cells > 0 else 0.0
                )
                statistics.append(
                    {
                        "label": "Data Completeness",
                        "value": completeness,
                        "is_percentage": True,
                    }
                )

        return statistics[:3]

    # Process AI suggestions and calculate actual values
    for suggestion in suggestions[:3]:  # Limit to 3 statistics
        try:
            label = suggestion.get("label", "Statistic")
            column_name = suggestion.get("column", "")
            operation = suggestion.get("operation", "count").lower()
            is_percentage = suggestion.get("is_percentage", False)

            # Skip if column doesn't exist
            if not column_name or column_name not in df.columns:
                continue

            col = df[column_name]
            value = None

            # Handle different operations
            if operation == "sum":
                if col.dtype == "object":
                    # Try to extract numeric values from strings
                    try:
                        numeric_values = (
                            col.astype(str)
                            .str.replace(r"[^\d.]", "", regex=True)
                            .replace("", pd.NA)
                            .dropna()
                            .astype(float)
                        )
                        value = (
                            float(numeric_values.sum())
                            if len(numeric_values) > 0
                            else 0.0
                        )
                    except:
                        value = 0.0
                else:
                    numeric_values = col.dropna()
                    value = (
                        float(numeric_values.sum()) if len(numeric_values) > 0 else 0.0
                    )

            elif operation == "mean" or operation == "average":
                if col.dtype == "object":
                    try:
                        numeric_values = (
                            col.astype(str)
                            .str.replace(r"[^\d.]", "", regex=True)
                            .replace("", pd.NA)
                            .dropna()
                            .astype(float)
                        )
                        value = (
                            float(numeric_values.mean())
                            if len(numeric_values) > 0
                            else 0.0
                        )
                    except:
                        value = 0.0
                else:
                    numeric_values = col.dropna()
                    value = (
                        float(numeric_values.mean()) if len(numeric_values) > 0 else 0.0
                    )

            elif operation == "count":
                value = float(len(col.dropna()))

            elif operation == "nunique" or operation == "unique":
                value = float(col.nunique())

            elif operation == "min":
                if col.dtype == "object":
                    try:
                        numeric_values = (
                            col.astype(str)
                            .str.replace(r"[^\d.]", "", regex=True)
                            .replace("", pd.NA)
                            .dropna()
                            .astype(float)
                        )
                        value = (
                            float(numeric_values.min())
                            if len(numeric_values) > 0
                            else 0.0
                        )
                    except:
                        value = 0.0
                else:
                    numeric_values = col.dropna()
                    value = (
                        float(numeric_values.min()) if len(numeric_values) > 0 else 0.0
                    )

            elif operation == "max":
                if col.dtype == "object":
                    try:
                        numeric_values = (
                            col.astype(str)
                            .str.replace(r"[^\d.]", "", regex=True)
                            .replace("", pd.NA)
                            .dropna()
                            .astype(float)
                        )
                        value = (
                            float(numeric_values.max())
                            if len(numeric_values) > 0
                            else 0.0
                        )
                    except:
                        value = 0.0
                else:
                    numeric_values = col.dropna()
                    value = (
                        float(numeric_values.max()) if len(numeric_values) > 0 else 0.0
                    )

            elif operation == "median":
                if col.dtype == "object":
                    try:
                        numeric_values = (
                            col.astype(str)
                            .str.replace(r"[^\d.]", "", regex=True)
                            .replace("", pd.NA)
                            .dropna()
                            .astype(float)
                        )
                        value = (
                            float(numeric_values.median())
                            if len(numeric_values) > 0
                            else 0.0
                        )
                    except:
                        value = 0.0
                else:
                    numeric_values = col.dropna()
                    value = (
                        float(numeric_values.median())
                        if len(numeric_values) > 0
                        else 0.0
                    )

            elif operation == "percentage":
                # Calculate percentage of non-null values
                total = len(df)
                non_null = len(col.dropna())
                value = (non_null / total * 100) if total > 0 else 0.0
                is_percentage = True

            else:
                # Default to count if operation is unknown
                value = float(len(col.dropna()))

            # Add statistic if we got a valid value
            if value is not None:
                statistics.append(
                    {"label": label, "value": value, "is_percentage": is_percentage}
                )

        except Exception as e:
            # Skip this statistic if calculation fails
            continue

    # Ensure we return exactly 3 statistics (pad if needed)
    while len(statistics) < 3:
        if len(statistics) == 0:
            statistics.append(
                {
                    "label": "Total Records",
                    "value": float(len(df)),
                    "is_percentage": False,
                }
            )
        elif len(statistics) == 1:
            statistics.append(
                {
                    "label": "Total Columns",
                    "value": float(len(df.columns)),
                    "is_percentage": False,
                }
            )
        elif len(statistics) == 2:
            total_cells = len(df) * len(df.columns)
            non_null_cells = df.notna().sum().sum()
            completeness = (
                (non_null_cells / total_cells * 100) if total_cells > 0 else 0.0
            )
            statistics.append(
                {
                    "label": "Data Completeness",
                    "value": completeness,
                    "is_percentage": True,
                }
            )

    # Return only the first 3 statistics
    return statistics[:3]
