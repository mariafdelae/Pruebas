"""
Cliente LLM unificado para OpenRouter (modelo gratuito stepfun/step-3.5-flash:free).
Todos los agentes usan este cliente para comunicarse con el modelo.
"""

import os
from openai import OpenAI


def get_client() -> OpenAI:
    """Retorna un cliente OpenAI configurado para OpenRouter."""
    return OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=os.getenv("OPENROUTER_API_KEY"),
    )


MODEL = "stepfun/step-3.5-flash:free"


def chat(messages: list[dict], temperature: float = 0.7) -> str:
    """Envía mensajes al modelo y retorna la respuesta como texto."""
    client = get_client()
    response = client.chat.completions.create(
        model=MODEL,
        messages=messages,
        temperature=temperature,
        max_tokens=2048,
    )
    return response.choices[0].message.content or ""
