"""Application state management."""
import pandas as pd
from typing import Optional

STATE = {
    "df": None,
    "metadata": None,
    "loaded_name": None,
}

def get_dataframe() -> Optional[pd.DataFrame]:
    """Get the current dataframe."""
    return STATE["df"]

def set_dataframe(df: pd.DataFrame) -> None:
    """Set the current dataframe."""
    STATE["df"] = df

def get_metadata() -> Optional[dict]:
    """Get the current metadata."""
    return STATE["metadata"]

def set_metadata(metadata: dict) -> None:
    """Set the current metadata."""
    STATE["metadata"] = metadata

def clear_state() -> None:
    """Clear all state."""
    STATE["df"] = None
    STATE["metadata"] = None
    STATE["loaded_name"] = None
