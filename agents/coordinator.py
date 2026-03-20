"""
Coordinador - Agente principal que orquesta a los sub-agentes.

El coordinador recibe las consultas del usuario (vía Telegram), decide
qué agente(s) debe invocar, recopila las respuestas y genera una
respuesta unificada.

Flujo:
  Usuario → Coordinador → [Agente Investigador | Agente Estadístico] → Respuesta
"""

import re

from utils.llm_client import chat
from agents.research_agent import investigate
from agents.stats_agent import analyze

SYSTEM_PROMPT = """Eres el Coordinador de un sistema multi-agente de análisis estadístico.
Tienes dos agentes a tu disposición:

1. **Agente Investigador**: Busca información teórica sobre conceptos, métodos y técnicas estadísticas.
2. **Agente Estadístico**: Analiza datos numéricos, calcula estadísticas, detecta distribuciones y sugiere modelos.

Tu trabajo es:
- Entender la consulta del usuario.
- Decidir qué agente(s) necesitas invocar.
- Responder con UNA de estas etiquetas según tu decisión:
  [INVESTIGAR] - Si necesitas al Agente Investigador
  [ANALIZAR] - Si necesitas al Agente Estadístico
  [AMBOS] - Si necesitas a ambos agentes
  [DIRECTO] - Si puedes responder directamente sin agentes

SOLO responde con la etiqueta y una breve justificación de tu decisión en UNA línea.
Ejemplo: [ANALIZAR] El usuario envió datos numéricos que requieren análisis estadístico."""


def _classify_query(query: str) -> str:
    """Clasifica la consulta para decidir qué agente(s) usar."""
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": query},
    ]
    response = chat(messages, temperature=0.1)

    # Extraer la etiqueta
    for tag in ["[AMBOS]", "[INVESTIGAR]", "[ANALIZAR]", "[DIRECTO]"]:
        if tag in response:
            return tag

    # Heurística de respaldo: detectar datos numéricos
    numbers = re.findall(r"[\d]+[.,]?[\d]*", query)
    if len(numbers) > 3:
        return "[ANALIZAR]"

    return "[INVESTIGAR]"


def _extract_data(query: str) -> str | None:
    """Intenta extraer datos numéricos del mensaje del usuario."""
    lines = query.strip().split("\n")
    data_lines = []
    for line in lines:
        # Línea con al menos 2 números
        numbers = re.findall(r"[\d]+[.,]?[\d]*", line)
        if len(numbers) >= 2:
            data_lines.append(line)

    if data_lines:
        return "\n".join(data_lines)

    # Intentar extraer lista de números
    numbers = re.findall(r"[\d]+[.,]?[\d]*", query)
    if len(numbers) >= 4:
        return ", ".join(numbers)

    return None


def process(query: str) -> str:
    """
    Procesa una consulta del usuario, invocando los agentes necesarios.

    Args:
        query: Mensaje del usuario.

    Returns:
        Respuesta completa y formateada.
    """
    classification = _classify_query(query)
    raw_data = _extract_data(query)
    parts = []

    if classification == "[DIRECTO]":
        messages = [
            {
                "role": "system",
                "content": (
                    "Eres un asistente experto en estadística. Responde en "
                    "español de forma clara y concisa usando markdown."
                ),
            },
            {"role": "user", "content": query},
        ]
        return chat(messages, temperature=0.5)

    if classification in ("[INVESTIGAR]", "[AMBOS]"):
        parts.append("# Investigación\n")
        parts.append(investigate(query))

    if classification in ("[ANALIZAR]", "[AMBOS]"):
        parts.append("\n\n# Análisis Estadístico\n")
        parts.append(analyze(query, raw_data))

    return "\n".join(parts) if parts else "No pude procesar tu consulta. Intenta reformularla."
