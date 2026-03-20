# Sistema Multi-Agente Estadístico con Telegram

Sistema de coordinación multi-agente para análisis estadístico, conectado a Telegram.
Usa el modelo gratuito `stepfun/step-3.5-flash:free` vía OpenRouter.

## Arquitectura

```
Telegram Bot ←→ Coordinador ←→ Agente Investigador (conceptos, teoría)
                             ←→ Agente Estadístico  (análisis de datos, modelos)
```

- **Coordinador**: Recibe la consulta, clasifica y decide qué agente(s) invocar.
- **Agente Investigador**: Busca información sobre conceptos y métodos estadísticos.
- **Agente Estadístico**: Analiza datos numéricos con scipy/pandas y sugiere modelos.

## Instalación

```bash
# 1. Instalar dependencias
pip install -r requirements.txt

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus keys
```

## Configuración

### OpenRouter (API gratis)
1. Ir a [openrouter.ai](https://openrouter.ai/)
2. Crear cuenta
3. Obtener API key
4. Ponerla en `.env` como `OPENROUTER_API_KEY`

### Telegram Bot
1. Abrir Telegram y buscar `@BotFather`
2. Enviar `/newbot` y seguir instrucciones
3. Copiar el token
4. Ponerlo en `.env` como `TELEGRAM_BOT_TOKEN`

## Uso

```bash
python bot.py
```

### Comandos del Bot
| Comando | Descripción |
|---------|-------------|
| `/start` | Mensaje de bienvenida |
| `/investigar <tema>` | Forzar investigación de un tema |
| `/analizar <datos>` | Forzar análisis de datos |
| `/help` | Mostrar ayuda |

### Ejemplos
- Enviar: `¿Qué es una regresión logística?` → Usa agente investigador
- Enviar: `12, 15, 18, 22, 25, 30, 35` → Usa agente estadístico
- Enviar: `Analiza estos datos y dime qué modelo usar: 5.2, 6.1, 7.3, 4.8` → Usa ambos agentes

## Estructura del Proyecto

```
├── bot.py                  # Bot de Telegram (punto de entrada)
├── agents/
│   ├── coordinator.py      # Coordinador principal
│   ├── research_agent.py   # Agente Investigador
│   └── stats_agent.py      # Agente Estadístico
├── utils/
│   └── llm_client.py       # Cliente LLM (OpenRouter)
├── requirements.txt
├── .env.example
└── .gitignore
```
