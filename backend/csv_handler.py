"""CSV file loading and encoding handling."""

import io
import base64
import pandas as pd
from backend.state import set_dataframe, set_metadata


def contains_unicode(data: bytes) -> bool:
    """Detect if data likely contains Unicode characters (Hebrew, Arabic, etc.)"""
    try:
        # Try to decode as UTF-8 to check for Unicode
        sample = data[: min(1024, len(data))]
        decoded = sample.decode("utf-8", errors="strict")
        # Check for Hebrew, Arabic, or other non-ASCII Unicode ranges
        for char in decoded:
            code_point = ord(char)
            # Hebrew: U+0590 to U+05FF, Arabic: U+0600 to U+06FF, and other common Unicode ranges
            if (
                0x0590 <= code_point <= 0x05FF  # Hebrew
                or 0x0600 <= code_point <= 0x06FF  # Arabic
                or code_point > 0x007F
            ):  # Any non-ASCII
                return True
    except (UnicodeDecodeError, UnicodeError):
        pass
    return False


def try_read_csv(
    raw: bytes, encoding: str, use_errors_replace: bool = False
) -> tuple[pd.DataFrame | None, Exception | None]:
    """Try to read CSV with a specific encoding."""
    try:
        raw_io = io.BytesIO(raw)
        # Try with lenient CSV parsing
        try:
            # Try with on_bad_lines (pandas >= 1.3.0)
            # Also try encoding_errors parameter if available (pandas >= 2.0.0)
            read_params = {
                "encoding": encoding,
                "on_bad_lines": "skip",
                "engine": "python",
            }
            # Add encoding_errors if pandas supports it
            try:
                import pandas as pd_test

                if hasattr(pd_test.read_csv, "__code__"):
                    # Check if encoding_errors parameter exists
                    import inspect

                    sig = inspect.signature(pd.read_csv)
                    if "encoding_errors" in sig.parameters:
                        read_params["encoding_errors"] = (
                            "replace" if use_errors_replace else "strict"
                        )
            except:
                pass

            df = pd.read_csv(raw_io, **read_params)
        except TypeError:
            # Fallback for older pandas versions
            try:
                raw_io = io.BytesIO(raw)
                df = pd.read_csv(
                    raw_io,
                    encoding=encoding,
                    error_bad_lines=False,
                    warn_bad_lines=False,
                    engine="python",
                )
            except TypeError:
                # Even older pandas - no error_bad_lines parameter
                raw_io = io.BytesIO(raw)
                df = pd.read_csv(raw_io, encoding=encoding, engine="python")
        # Check if we got a valid dataframe
        if df is not None and not df.empty:
            return df, None
        return None, ValueError("Empty dataframe after reading")
    except UnicodeDecodeError as e:
        # If we haven't tried with errors='replace', try that as a fallback
        if not use_errors_replace:
            try:
                # Decode with errors='replace' and re-encode as UTF-8
                decoded = raw.decode(encoding, errors="replace")
                raw_utf8 = decoded.encode("utf-8")
                raw_io = io.BytesIO(raw_utf8)
                try:
                    df = pd.read_csv(
                        raw_io, encoding="utf-8", on_bad_lines="skip", engine="python"
                    )
                except TypeError:
                    try:
                        raw_io = io.BytesIO(raw_utf8)
                        df = pd.read_csv(
                            raw_io,
                            encoding="utf-8",
                            error_bad_lines=False,
                            warn_bad_lines=False,
                            engine="python",
                        )
                    except TypeError:
                        raw_io = io.BytesIO(raw_utf8)
                        df = pd.read_csv(raw_io, encoding="utf-8", engine="python")
                if df is not None and not df.empty:
                    return df, None
            except Exception:
                pass
        return None, e
    except LookupError as e:
        # Unknown encoding
        return None, e
    except Exception as e:
        error_str = str(e).lower()
        # Check if it's an encoding error
        if (
            "codec can't decode" in error_str
            or "invalid continuation byte" in error_str
            or "can't decode byte" in error_str
            or "'utf-8' codec can't decode" in error_str
            or "unknown encoding" in error_str
            or "codec" in error_str
            and "decode" in error_str
        ):
            return None, e
        # For CSV parsing errors, we might still want to try other encodings
        # But mark it as a non-encoding error
        return None, e


def detect_and_convert_encoding(
    raw: bytes, tried_encodings: list[str]
) -> tuple[pd.DataFrame | None, str | None]:
    """Try to detect encoding and convert to UTF-8."""
    # Extended list of encodings to try, including Hebrew and common Windows encodings
    all_encodings_to_try = [
        # Hebrew encodings
        "windows-1255",
        "iso-8859-8",
        "cp1255",
        "iso-8859-8-i",
        # Common Windows encodings
        "windows-1252",
        "cp1252",
        "iso-8859-1",
        "latin-1",
        # Other common encodings
        "cp850",
        "cp437",
        "mac-roman",
        "iso-8859-15",
        # UTF variants
        "utf-16",
        "utf-16le",
        "utf-16be",
        "utf-32",
    ]

    # Try charset-normalizer first for automatic detection
    detected_encodings = []
    try:
        from charset_normalizer import from_bytes

        result = from_bytes(raw)
        if result and len(result) > 0:
            # Get the best match
            best_match = result.best()
            if best_match and hasattr(best_match, "encoding") and best_match.encoding:
                detected_encoding = best_match.encoding.lower()
                detected_encodings.append(detected_encoding)
                # Add to front of list to try it first
                if detected_encoding not in [e.lower() for e in all_encodings_to_try]:
                    all_encodings_to_try.insert(0, detected_encoding)

            # Also try top matches from charset-normalizer (up to 5)
            try:
                for i, match in enumerate(result):
                    if i >= 5:  # Limit to top 5
                        break
                    if match and hasattr(match, "encoding") and match.encoding:
                        enc = match.encoding.lower()
                        if enc not in [
                            e.lower() for e in detected_encodings
                        ] and enc not in [e.lower() for e in all_encodings_to_try]:
                            detected_encodings.append(enc)
                            all_encodings_to_try.insert(0, enc)
            except (TypeError, AttributeError):
                # If result is not iterable or doesn't support indexing, just use best match
                pass
    except ImportError:
        pass  # charset-normalizer not available, continue with manual detection
    except Exception:
        pass  # Detection failed, continue with manual encodings

    # Try each encoding: decode, convert to UTF-8, and try reading
    for encoding in all_encodings_to_try:
        # Skip if we already tried this encoding
        if encoding.lower() in [e.lower() for e in tried_encodings]:
            continue

        try:
            # Try to decode with this encoding (use 'replace' to handle any byte)
            decoded_text = raw.decode(encoding, errors="replace")

            # Re-encode as UTF-8
            raw_utf8 = decoded_text.encode("utf-8")

            # Try reading the converted UTF-8 data
            df, error = try_read_csv(raw_utf8, "utf-8")
            if df is not None and not df.empty:
                return df, f"{encoding} (converted to utf-8)"
        except LookupError:
            # Encoding not found, try next
            continue
        except Exception as e:
            # For other errors, still try next encoding
            # But if it's a CSV parsing error (not encoding), we might want to know
            continue

    # If conversion approach failed, try reading directly with detected encodings
    for detected_encoding in detected_encodings:
        if detected_encoding not in [e.lower() for e in tried_encodings]:
            try:
                df, error = try_read_csv(raw, detected_encoding)
                if df is not None and not df.empty:
                    return df, detected_encoding
            except Exception:
                continue

    return None, None


def load_csv(csv_base64: str) -> dict:
    """Load CSV file from base64 string."""
    if not csv_base64:
        raise ValueError("CSV file is required. Please select a CSV file to upload.")

    try:
        raw = base64.b64decode(csv_base64)
    except Exception as e:
        raise ValueError(
            f"Failed to decode file data: {str(e)}. Please try uploading the file again."
        )

    has_unicode = contains_unicode(raw)

    # Prioritize UTF-8 encodings, especially for files with Unicode/Hebrew characters
    if has_unicode:
        # For Unicode files, try UTF-8 variants first and more aggressively
        encodings_to_try = ["utf-8-sig", "utf-8"]
        # Only try other encodings if UTF-8 fails
        fallback_encodings = [
            "windows-1255",
            "iso-8859-8",
            "latin-1",
            "iso-8859-1",
            "cp1252",
            "windows-1252",
        ]
    else:
        # For non-Unicode files, try UTF-8 first but allow fallbacks
        # Include latin-1 early as it can decode any byte sequence
        encodings_to_try = [
            "utf-8-sig",
            "utf-8",
            "latin-1",
            "iso-8859-1",
            "cp1252",
            "windows-1252",
            "windows-1255",
            "iso-8859-8",
        ]
        fallback_encodings = []

    df = None
    last_error = None
    encoding_used = None

    # Try UTF-8 encodings first (especially important for Hebrew)
    for encoding in encodings_to_try:
        df, error = try_read_csv(raw, encoding)
        if df is not None:
            encoding_used = encoding
            break
        if error:
            last_error = error

    # If UTF-8 failed and we have fallback encodings, try them
    if df is None and fallback_encodings:
        for encoding in fallback_encodings:
            df, error = try_read_csv(raw, encoding)
            if df is not None:
                encoding_used = encoding
                break
            if error:
                last_error = error

    # If all encodings failed, try to detect and convert encoding automatically
    if df is None:
        df, encoding_used = detect_and_convert_encoding(
            raw, encodings_to_try + fallback_encodings
        )

    # If still no success, try a few more common encodings as last resort
    if df is None:
        last_resort_encodings = [
            "cp1250",
            "cp1251",
            "cp1253",
            "cp1254",
            "cp1256",
            "cp1257",
            "cp1258",
            "iso-8859-2",
            "iso-8859-3",
            "iso-8859-4",
            "iso-8859-5",
            "iso-8859-6",
            "iso-8859-7",
            "iso-8859-9",
            "iso-8859-10",
            "iso-8859-13",
            "iso-8859-14",
            "iso-8859-15",
            "iso-8859-16",
        ]
        for encoding in last_resort_encodings:
            df, error = try_read_csv(raw, encoding)
            if df is not None and not df.empty:
                encoding_used = encoding
                break

    # Final fallback: Use latin-1 (which can decode ANY byte sequence) and convert to UTF-8
    # This is a last resort that will work but may have some character corruption
    if df is None:
        try:
            # Latin-1 can decode any byte sequence (maps 1:1 to Unicode)
            # This will always succeed, even if characters are wrong
            decoded_text = raw.decode("latin-1", errors="replace")
            raw_utf8 = decoded_text.encode("utf-8")

            # Try with different delimiters and parsing options
            delimiters_to_try = [",", ";", "\t", "|"]
            for delimiter in delimiters_to_try:
                try:
                    raw_io = io.BytesIO(raw_utf8)
                    try:
                        df = pd.read_csv(
                            raw_io,
                            encoding="utf-8",
                            on_bad_lines="skip",
                            engine="python",
                            sep=delimiter,
                        )
                    except TypeError:
                        try:
                            raw_io = io.BytesIO(raw_utf8)
                            df = pd.read_csv(
                                raw_io,
                                encoding="utf-8",
                                error_bad_lines=False,
                                warn_bad_lines=False,
                                engine="python",
                                sep=delimiter,
                            )
                        except TypeError:
                            raw_io = io.BytesIO(raw_utf8)
                            df = pd.read_csv(
                                raw_io, encoding="utf-8", engine="python", sep=delimiter
                            )

                    if df is not None and not df.empty:
                        encoding_used = f"latin-1 (converted to utf-8, delimiter={repr(delimiter)}, may have character issues)"
                        break
                except Exception:
                    continue

            # If delimiter detection failed, try auto-detection
            if df is None or df.empty:
                try:
                    raw_io = io.BytesIO(raw_utf8)
                    try:
                        df = pd.read_csv(
                            raw_io,
                            encoding="utf-8",
                            on_bad_lines="skip",
                            engine="python",
                            sep=None,
                        )
                    except TypeError:
                        try:
                            raw_io = io.BytesIO(raw_utf8)
                            df = pd.read_csv(
                                raw_io,
                                encoding="utf-8",
                                error_bad_lines=False,
                                warn_bad_lines=False,
                                engine="python",
                                sep=None,
                            )
                        except TypeError:
                            raw_io = io.BytesIO(raw_utf8)
                            df = pd.read_csv(
                                raw_io, encoding="utf-8", engine="python", sep=None
                            )

                    if df is not None and not df.empty:
                        encoding_used = "latin-1 (converted to utf-8, auto-detected delimiter, may have character issues)"
                except Exception:
                    pass
        except Exception as e:
            # Even this fallback failed - file might be corrupted or not a CSV
            last_error = e

    if df is None or df.empty:
        error_msg = str(last_error).lower() if last_error else ""

        # Check if file appears to be binary or corrupted
        try:
            # Check if file has reasonable text content (at least some printable ASCII)
            sample = raw[: min(1000, len(raw))]
            text_chars = sum(
                1 for b in sample if 32 <= b <= 126 or b in [9, 10, 13]
            )  # printable ASCII + tab, newline, carriage return
            if len(sample) > 0 and text_chars / len(sample) < 0.5:
                raise ValueError(
                    "The file does not appear to be a valid CSV file. "
                    "It may be binary, corrupted, or in an unsupported format. "
                    "Please ensure you're uploading a CSV (Comma Separated Values) file."
                )
        except Exception:
            pass  # Skip this check if it fails

        if (
            "codec" in error_msg
            or "decode" in error_msg
            or "utf-8" in error_msg
            or "invalid continuation byte" in error_msg
            or "can't decode byte" in error_msg
        ):
            raise ValueError(
                "File encoding error. The CSV file could not be read due to encoding issues. "
                "We attempted to automatically detect and convert the encoding using multiple methods (including charset-normalizer), but were unable to. "
                "The file may be in an unusual encoding or corrupted. "
                "Please try: 1) Opening the file in a text editor and saving it as UTF-8, "
                "2) In Excel: File > Save As > CSV UTF-8 (Comma delimited), "
                "3) Or use a different program to export the file as UTF-8 CSV."
            )
        elif "empty" in error_msg or (df is not None and df.empty):
            raise ValueError(
                "The CSV file appears to be empty or could not be parsed. "
                "Please ensure the file contains data and is in a valid CSV format."
            )
        else:
            # Check if it's a CSV parsing error
            if "pandas" in error_msg or "parse" in error_msg or "read_csv" in error_msg:
                raise ValueError(
                    f"Failed to parse CSV file: {str(last_error) if last_error else 'Unknown error'}. "
                    "Please ensure the file is a valid CSV format with proper delimiters and try again."
                )
            raise ValueError(
                f"Failed to read CSV file: {str(last_error) if last_error else 'Unknown error'}. "
                "Please ensure the file is a valid CSV format and try again."
            )

    # Preserve Hebrew characters in column names - only replace spaces with underscores
    # Use regex=False to avoid regex issues with Hebrew characters
    df.columns = df.columns.str.strip().str.replace(" ", "_", regex=False)

    # Ensure string columns preserve Hebrew text by keeping them as object dtype
    # Object dtype preserves Unicode/Hebrew characters correctly
    # No need to convert - pandas already uses object dtype for string columns with Unicode

    set_dataframe(df)
    set_metadata(None)

    return {
        "rows": int(df.shape[0]),
        "cols": int(df.shape[1]),
        "columns": list(df.columns),
    }
