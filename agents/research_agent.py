"""
Agente Investigador - Busca y sintetiza información sobre temas estadísticos.

Este agente recibe una consulta del coordinador, la investiga usando el LLM
y devuelve un resumen estructurado con la información encontrada.
"""

from utils.llm_client import chat

SYSTEM_PROMPT = """Eres un agente investigador especializado en estadística y ciencia de datos.
Tu rol es:
1. Investigar conceptos, métodos y técnicas estadísticas.
2. Buscar información relevante sobre el tema consultado.
3. Proporcionar contexto teórico claro y accesible.
4. Incluir referencias a metodologías reconocidas.
5. Explicar cuándo y por qué se usan ciertos métodos.

Responde SIEMPRE en español. Sé claro, preciso y didáctico.
Estructura tu respuesta con secciones claras usando markdown."""


def investigate(query: str) -> str:
    """
    Investiga un tema y retorna un resumen estructurado.

    Args:
        query: La pregunta o tema a investigar.

    Returns:
        Resumen con la información encontrada.
    """
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": (
                f"Investiga lo siguiente y proporciona información detallada:\n\n"
                f"{query}\n\n"
                f"Incluye:\n"
                f"- Definición y conceptos clave\n"
                f"- Métodos y técnicas relevantes\n"
                f"- Casos de uso comunes\n"
                f"- Ventajas y limitaciones"
            ),
        },
    ]
    return chat(messages, temperature=0.5)
