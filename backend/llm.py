"""LLM factory and initialization."""
try:
    from langchain_openai import ChatOpenAI
    from langchain_google_genai import ChatGoogleGenerativeAI
    GEMINI_AVAILABLE = True
except ImportError as e:
    import sys
    print(f"Warning: Could not import langchain_google_genai: {e}", file=sys.stderr)
    from langchain_openai import ChatOpenAI
    GEMINI_AVAILABLE = False


def get_llm(model: str, api_key: str):
    """Factory function to get the appropriate LLM based on model name."""
    if not api_key or not api_key.strip():
        raise ValueError("API key cannot be empty.")
    
    try:
        if model.startswith("gemini"):
            if not GEMINI_AVAILABLE:
                raise ValueError("Gemini models are not available. Please install langchain-google-genai.")
            return ChatGoogleGenerativeAI(temperature=0, model=model, google_api_key=api_key)
        else:
            return ChatOpenAI(temperature=0, model=model, openai_api_key=api_key)
    except Exception as e:
        # Re-raise with more context
        error_str = str(e).lower()
        if "invalid" in error_str or "authentication" in error_str:
            raise ValueError("Invalid API key. Please verify your API key is correct.")
        raise
