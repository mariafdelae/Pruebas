"""
Bot de Telegram - Interfaz de usuario para el sistema multi-agente estadístico.

Comandos disponibles:
  /start       - Bienvenida e instrucciones
  /investigar  - Forzar uso del agente investigador
  /analizar    - Forzar uso del agente estadístico
  /help        - Mostrar ayuda

Cualquier mensaje de texto se envía al Coordinador, que decide automáticamente
qué agente(s) usar.
"""

import os
import logging

from dotenv import load_dotenv
from telegram import Update
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    filters,
    ContextTypes,
)

from agents.coordinator import process
from agents.research_agent import investigate
from agents.stats_agent import analyze

load_dotenv()

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

# Telegram tiene límite de 4096 caracteres por mensaje
MAX_MSG_LEN = 4000


def _split_message(text: str) -> list[str]:
    """Divide un mensaje largo en partes que respeten el límite de Telegram."""
    if len(text) <= MAX_MSG_LEN:
        return [text]

    parts = []
    while text:
        if len(text) <= MAX_MSG_LEN:
            parts.append(text)
            break
        # Buscar un buen punto de corte
        cut = text.rfind("\n", 0, MAX_MSG_LEN)
        if cut == -1:
            cut = MAX_MSG_LEN
        parts.append(text[:cut])
        text = text[cut:].lstrip("\n")
    return parts


async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Maneja el comando /start."""
    welcome = (
        "Hola! Soy tu **Asistente Estadístico Multi-Agente**.\n\n"
        "Tengo dos agentes especializados:\n"
        "- **Investigador**: Busca información sobre conceptos y métodos estadísticos.\n"
        "- **Estadístico**: Analiza datos, calcula estadísticas y sugiere modelos.\n\n"
        "**Cómo usarme:**\n"
        "- Envíame cualquier pregunta sobre estadística y yo decido qué agente usar.\n"
        "- Envía datos numéricos (separados por comas o en formato CSV) para análisis.\n"
        "- Usa /investigar + tema para forzar investigación.\n"
        "- Usa /analizar + datos para forzar análisis estadístico.\n\n"
        "**Ejemplos:**\n"
        "- `¿Qué es una regresión logística?`\n"
        "- `Analiza estos datos: 12, 15, 18, 22, 25, 30, 35`\n"
        "- `/investigar prueba chi-cuadrado`\n"
        "- `/analizar 5.2, 6.1, 7.3, 4.8, 5.5, 6.7`"
    )
    await update.message.reply_text(welcome, parse_mode="Markdown")


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Maneja el comando /help."""
    help_text = (
        "**Comandos disponibles:**\n\n"
        "/start - Mensaje de bienvenida\n"
        "/investigar `<tema>` - Investigar un concepto estadístico\n"
        "/analizar `<datos>` - Analizar datos numéricos\n"
        "/help - Esta ayuda\n\n"
        "**Tips:**\n"
        "- Puedes enviar datos como CSV pegados directamente.\n"
        "- Si envías una pregunta con datos, ambos agentes trabajarán juntos.\n"
        "- Sé específico en tus preguntas para mejores resultados."
    )
    await update.message.reply_text(help_text, parse_mode="Markdown")


async def investigate_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Maneja el comando /investigar - fuerza el uso del agente investigador."""
    query = " ".join(context.args) if context.args else ""
    if not query:
        await update.message.reply_text(
            "Usa: /investigar `<tema>`\nEjemplo: /investigar regresión lineal",
            parse_mode="Markdown",
        )
        return

    await update.message.reply_text("Investigando... dame un momento.")
    try:
        result = investigate(query)
        for part in _split_message(result):
            await update.message.reply_text(part, parse_mode="Markdown")
    except Exception as e:
        logger.error("Error en investigación: %s", e)
        await update.message.reply_text(f"Error al investigar: {e}")


async def analyze_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Maneja el comando /analizar - fuerza el uso del agente estadístico."""
    query = " ".join(context.args) if context.args else ""
    if not query:
        await update.message.reply_text(
            "Usa: /analizar `<datos>`\nEjemplo: /analizar 12, 15, 18, 22, 25",
            parse_mode="Markdown",
        )
        return

    await update.message.reply_text("Analizando datos... dame un momento.")
    try:
        result = analyze(query, query)
        for part in _split_message(result):
            await update.message.reply_text(part, parse_mode="Markdown")
    except Exception as e:
        logger.error("Error en análisis: %s", e)
        await update.message.reply_text(f"Error al analizar: {e}")


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Maneja mensajes de texto libres - los envía al Coordinador."""
    query = update.message.text
    if not query:
        return

    await update.message.reply_text("Procesando tu consulta... dame un momento.")
    try:
        result = process(query)
        for part in _split_message(result):
            await update.message.reply_text(part, parse_mode="Markdown")
    except Exception as e:
        logger.error("Error procesando mensaje: %s", e)
        await update.message.reply_text(
            f"Ocurrió un error al procesar tu consulta: {e}\n"
            "Intenta reformular tu pregunta."
        )


def main() -> None:
    """Inicia el bot de Telegram."""
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token:
        print("ERROR: Falta TELEGRAM_BOT_TOKEN en el archivo .env")
        print("1. Habla con @BotFather en Telegram")
        print("2. Crea un bot con /newbot")
        print("3. Copia el token y ponlo en .env")
        return

    if not os.getenv("OPENROUTER_API_KEY"):
        print("ERROR: Falta OPENROUTER_API_KEY en el archivo .env")
        print("1. Ve a https://openrouter.ai/")
        print("2. Crea una cuenta y obtén tu API key")
        print("3. Copia la key y ponla en .env")
        return

    app = Application.builder().token(token).build()

    # Registrar handlers
    app.add_handler(CommandHandler("start", start_command))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(CommandHandler("investigar", investigate_command))
    app.add_handler(CommandHandler("analizar", analyze_command))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    print("Bot iniciado! Presiona Ctrl+C para detener.")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
