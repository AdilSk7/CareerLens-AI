"""
llm_client.py — Provider-agnostic async LLM gateway.

Configure the active provider in backend/.env:
  AI_PROVIDER=groq   → uses Groq (llama-3.1-8b-instant or any GROQ_MODEL)
  AI_PROVIDER=gemini → uses Google Gemini (GEMINI_MODEL)

Business logic in ai_service.py never imports a provider SDK directly.
All prompt construction stays in ai_service.py; all HTTP execution happens here.
"""

import os
import json
from fastapi import HTTPException

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

AI_PROVIDER  = os.getenv("AI_PROVIDER", "gemini").lower()

# ── Groq ──────────────────────────────────────────────────────────────────────
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL   = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")

# ── Gemini ────────────────────────────────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL   = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")

# Lazy-init so we don't crash on startup if a key is missing
_groq_client   = None
_gemini_inited = False


def _get_groq_client():
    global _groq_client
    if _groq_client is None:
        if not GROQ_API_KEY or GROQ_API_KEY == "your_groq_api_key_here":
            raise HTTPException(
                status_code=500,
                detail="GROQ_API_KEY is not configured. Set it in backend/.env"
            )
        from groq import Groq
        _groq_client = Groq(api_key=GROQ_API_KEY)
    return _groq_client


def _init_gemini():
    global _gemini_inited
    if not _gemini_inited:
        if not GEMINI_API_KEY:
            raise HTTPException(
                status_code=500,
                detail="GEMINI_API_KEY is not configured. Set it in backend/.env"
            )
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        _gemini_inited = True


import re

def _extract_json(text: str) -> str:
    """Extract JSON from markdown code blocks or return as-is."""
    text = text.strip()
    match = re.search(r'```(?:json)?\s*(.*?)\s*```', text, re.DOTALL)
    if match:
        return match.group(1).strip()
    # Also strip leading/trailing text if the model failed to use codeblocks
    start = text.find('{')
    end = text.rfind('}')
    if start != -1 and end != -1:
        return text[start:end+1]
    return text

async def call_llm(
    prompt: str,
    system_instruction: str = "",
    json_schema: dict | None = None,
) -> str:
    """
    Async unified entry point.  Returns a raw JSON string.

    Parameters
    ----------
    prompt             : The user-facing prompt.
    system_instruction : Optional system-level instructions.
    json_schema        : Optional Pydantic model_json_schema() dict — used only
                         for Gemini's native structured output; Groq derives
                         schema constraints from the prompt instead.
    """
    provider = AI_PROVIDER

    # ── Groq path ─────────────────────────────────────────────────────────────
    if provider == "groq":
        client = _get_groq_client()

        # Enforce json output instruction
        sys_msg = system_instruction or "You are a precise JSON data extraction tool."
        sys_msg += "\nAlways return only valid raw JSON. Do not use markdown codeblocks."
        
        messages = [{"role": "system", "content": sys_msg}]
        messages.append({"role": "user", "content": prompt})

        try:
            completion = client.chat.completions.create(
                model=GROQ_MODEL,
                messages=messages,
                temperature=0.2,
                max_tokens=4096,
                response_format={"type": "json_object"}
            )
            raw = completion.choices[0].message.content
            clean = _extract_json(raw)
            # Quick sanity-check: must be parse-able JSON
            try:
                json.loads(clean)
            except Exception as e:
                raise Exception(f"JSON extract failed. Raw output: {repr(raw)}")
            return clean
        except Exception as e:
            print(f"WARNING: Groq LLM call failed ({str(e)}). Falling back to Gemini...")
            # Fallback to gemini seamlessly
            return await _call_gemini(prompt, system_instruction, json_schema)

    # ── Gemini path ───────────────────────────────────────────────────────────
    elif provider == "gemini":
        return await _call_gemini(prompt, system_instruction, json_schema)

    else:
        raise HTTPException(
            status_code=500,
            detail=f"Unknown AI_PROVIDER '{provider}'. Use 'groq' or 'gemini'."
        )

async def _call_gemini(prompt: str, system_instruction: str, json_schema: dict | None) -> str:
    _init_gemini()
    import google.generativeai as genai

    gen_kwargs: dict = {"response_mime_type": "application/json"}
    if json_schema:
        gen_kwargs["response_schema"] = json_schema

    try:
        model = genai.GenerativeModel(
            model_name=GEMINI_MODEL,
            system_instruction=system_instruction or None,
            generation_config=genai.types.GenerationConfig(**gen_kwargs),
        )
        response = model.generate_content(prompt)
        return response.text
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Both Groq and Gemini failed. Last error (Gemini): {str(e)}"
        )
