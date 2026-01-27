"""Command handlers."""

import pandas as pd
from backend.state import get_dataframe, get_metadata, set_dataframe, set_metadata
from backend.llm import get_llm
from backend.csv_handler import load_csv
from backend.metadata import generate_metadata, calculate_statistics
from backend.analysis import run_analysis, get_metrics


def cmd_load_csv(payload: dict):
    """Handle load_csv command."""
    csv_base64 = payload.get("csv_base64")
    return load_csv(csv_base64)


def cmd_set_metadata(payload: dict):
    """Restore metadata from the frontend (e.g., after app restart/update)."""
    metadata = payload.get("metadata")
    if not isinstance(metadata, dict):
        raise ValueError("Invalid metadata payload.")
    set_metadata(metadata)
    return {"ok": True}


def cmd_generate_metadata(payload: dict):
    """Handle generate_metadata command."""
    df = get_dataframe()
    if df is None:
        raise ValueError("No dataset loaded. Please load a CSV file first.")

    api_key = payload.get("openai_api_key")
    model = payload.get("model", "gpt-4o")
    if not api_key:
        raise ValueError(
            "API key is required. Please enter your OpenAI or Google API key."
        )

    try:
        llm = get_llm(model, api_key)
    except Exception as e:
        error_msg = str(e).lower()
        if (
            "invalid" in error_msg
            or "authentication" in error_msg
            or "unauthorized" in error_msg
        ):
            raise ValueError(
                "Invalid API key. Please check your API key and try again."
            )
        if "rate limit" in error_msg or "quota" in error_msg:
            raise ValueError("API rate limit exceeded. Please try again later.")
        raise ValueError(f"API key error: {str(e)}")

    try:
        md = generate_metadata(df, llm)
        if not md:
            raise RuntimeError(
                "Failed to generate metadata. The LLM response was invalid. Please try again."
            )
    except ValueError as e:
        # Re-raise ValueError as-is (already user-friendly)
        raise
    except Exception as e:
        raise RuntimeError(f"Failed to generate metadata: {str(e)}")

    # optional preprocessing
    if md.get("primary_date") and md["primary_date"] in df.columns:
        df[md["primary_date"]] = pd.to_datetime(df[md["primary_date"]], errors="coerce")
        set_dataframe(df)

    # Calculate accurate statistics from the actual data
    statistics = calculate_statistics(df, md)
    md["statistics"] = statistics

    set_metadata(md)
    return md


def cmd_get_metrics(payload: dict):
    """Handle get_metrics command."""
    df = get_dataframe()
    if df is None:
        raise ValueError("No dataset loaded. Please load a CSV file first.")

    metadata = get_metadata()
    if metadata is None:
        raise ValueError("No metadata available. Please generate metadata first.")

    return get_metrics(metadata)


def cmd_run_analysis(payload: dict):
    """Handle run_analysis command."""
    df = get_dataframe()
    if df is None:
        raise ValueError("No dataset loaded. Please load a CSV file first.")

    metadata = get_metadata()
    if metadata is None:
        raise ValueError("No metadata available. Please generate metadata first.")

    api_key = payload.get("openai_api_key")
    model = payload.get("model", "gpt-4o")
    query = payload.get("query")
    bot_id = payload.get("bot_id")
    if not api_key:
        raise ValueError(
            "API key is required. Please enter your OpenAI or Google API key."
        )
    if not query:
        raise ValueError("Query is required. Please enter a question to analyze.")

    try:
        llm = get_llm(model, api_key)
    except Exception as e:
        error_msg = str(e).lower()
        if (
            "invalid" in error_msg
            or "authentication" in error_msg
            or "unauthorized" in error_msg
        ):
            raise ValueError(
                "Invalid API key. Please check your API key and try again."
            )
        if "rate limit" in error_msg or "quota" in error_msg:
            raise ValueError("API rate limit exceeded. Please try again later.")
        raise ValueError(f"API key error: {str(e)}")

    try:
        answer = run_analysis(query, df, llm, metadata, bot_id=bot_id)
        return {"answer": answer}
    except Exception as e:
        raise RuntimeError(
            f"Analysis failed: {str(e)}. Please try rephrasing your question."
        )


def cmd_validate_api_key(payload: dict):
    """Validate that the provided model + API key can make a minimal request."""
    api_key = payload.get("openai_api_key")
    model = payload.get("model", "gpt-4o")
    if not api_key:
        raise ValueError(
            "API key is required. Please enter your OpenAI or Google API key."
        )

    try:
        llm = get_llm(model, api_key)
    except Exception as e:
        error_msg = str(e).lower()
        if (
            "invalid" in error_msg
            or "authentication" in error_msg
            or "unauthorized" in error_msg
        ):
            raise ValueError("Invalid API key. Please check your API key and try again.")
        if "rate limit" in error_msg or "quota" in error_msg:
            raise ValueError("API rate limit exceeded. Please try again later.")
        raise ValueError(f"API key error: {str(e)}")

    try:
        # A real round-trip is required; constructing the client is not sufficient.
        # LangChain chat models accept a string and return an AIMessage-like object.
        _ = llm.invoke("ping")
        return {"ok": True}
    except Exception as e:
        error_msg = str(e).lower()
        if (
            "invalid" in error_msg
            or "authentication" in error_msg
            or "unauthorized" in error_msg
        ):
            raise ValueError("Invalid API key. Please check your API key and try again.")
        if "rate limit" in error_msg or "quota" in error_msg:
            raise ValueError("API rate limit exceeded. Please try again later.")
        raise RuntimeError(f"API validation failed: {str(e)}")


def handle(msg: dict):
    """Handle incoming command messages."""
    cmd = msg.get("cmd")
    payload = msg.get("payload", {})

    if cmd == "ping":
        return "pong"
    if cmd == "load_csv":
        return cmd_load_csv(payload)
    if cmd == "set_metadata":
        return cmd_set_metadata(payload)
    if cmd == "generate_metadata":
        return cmd_generate_metadata(payload)
    if cmd == "get_metrics":
        return cmd_get_metrics(payload)
    if cmd == "run_analysis":
        return cmd_run_analysis(payload)
    if cmd == "validate_api_key":
        return cmd_validate_api_key(payload)

    raise ValueError(f"Unknown cmd: {cmd}")
