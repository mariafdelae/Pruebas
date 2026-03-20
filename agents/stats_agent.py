"""
Agente Estadístico - Analiza datos y sugiere modelos estadísticos.

Este agente recibe datos o descripciones de datos del coordinador,
los analiza y sugiere qué tipo de modelo estadístico es más apropiado.
Puede realizar análisis descriptivo, detectar patrones y recomendar
pruebas estadísticas.
"""

import io
import numpy as np
import pandas as pd
from scipy import stats as sp_stats

from utils.llm_client import chat

SYSTEM_PROMPT = """Eres un agente estadístico experto en análisis de datos.
Tu rol es:
1. Analizar datos numéricos y categóricos.
2. Calcular estadísticas descriptivas (media, mediana, desviación estándar, etc.).
3. Detectar el tipo de distribución de los datos.
4. Sugerir qué modelo estadístico es más apropiado según el comportamiento de los datos.
5. Explicar paso a paso por qué recomiendas cierto modelo.
6. Realizar pruebas de normalidad, correlación, etc.

Responde SIEMPRE en español. Sé riguroso pero accesible.
Usa formato markdown con tablas cuando sea útil."""


def _parse_data(raw_data: str) -> pd.DataFrame | None:
    """Intenta parsear datos desde texto (CSV, separados por espacios, etc.)."""
    for sep in [",", ";", "\t", " "]:
        try:
            df = pd.read_csv(io.StringIO(raw_data.strip()), sep=sep)
            if len(df.columns) >= 1 and len(df) >= 2:
                return df
        except Exception:
            continue

    # Intentar como lista de números
    try:
        numbers = [float(x.strip()) for x in raw_data.replace(",", " ").split() if x.strip()]
        if numbers:
            return pd.DataFrame({"valores": numbers})
    except ValueError:
        pass

    return None


def _descriptive_stats(df: pd.DataFrame) -> str:
    """Genera estadísticas descriptivas de un DataFrame."""
    numeric_cols = df.select_dtypes(include=[np.number])
    if numeric_cols.empty:
        return "No se encontraron columnas numéricas para analizar."

    lines = ["## Estadísticas Descriptivas\n"]

    for col in numeric_cols.columns:
        data = numeric_cols[col].dropna()
        if data.empty:
            continue

        lines.append(f"### Variable: `{col}`")
        lines.append(f"| Métrica | Valor |")
        lines.append(f"|---------|-------|")
        lines.append(f"| N (observaciones) | {len(data)} |")
        lines.append(f"| Media | {data.mean():.4f} |")
        lines.append(f"| Mediana | {data.median():.4f} |")
        lines.append(f"| Desv. Estándar | {data.std():.4f} |")
        lines.append(f"| Mínimo | {data.min():.4f} |")
        lines.append(f"| Máximo | {data.max():.4f} |")
        lines.append(f"| Asimetría (skew) | {data.skew():.4f} |")
        lines.append(f"| Curtosis | {data.kurtosis():.4f} |")
        lines.append(f"| Q1 (25%) | {data.quantile(0.25):.4f} |")
        lines.append(f"| Q3 (75%) | {data.quantile(0.75):.4f} |")
        lines.append(f"| IQR | {(data.quantile(0.75) - data.quantile(0.25)):.4f} |")

        # Prueba de normalidad (Shapiro-Wilk si n <= 5000)
        if len(data) <= 5000:
            stat, p_value = sp_stats.shapiro(data)
            normal = "Sí (p > 0.05)" if p_value > 0.05 else "No (p <= 0.05)"
            lines.append(f"| Shapiro-Wilk stat | {stat:.4f} |")
            lines.append(f"| Shapiro-Wilk p-value | {p_value:.4f} |")
            lines.append(f"| ¿Normal? | {normal} |")

        lines.append("")

    # Correlaciones si hay más de una variable numérica
    if len(numeric_cols.columns) > 1:
        lines.append("## Matriz de Correlación (Pearson)\n")
        corr = numeric_cols.corr()
        lines.append(corr.to_markdown())
        lines.append("")

    return "\n".join(lines)


def _suggest_model(df: pd.DataFrame) -> str:
    """Genera sugerencias de modelo basadas en las características de los datos."""
    numeric_cols = df.select_dtypes(include=[np.number])
    categorical_cols = df.select_dtypes(exclude=[np.number])
    n_rows = len(df)
    n_numeric = len(numeric_cols.columns)
    n_categorical = len(categorical_cols.columns)

    suggestions = ["## Sugerencia de Modelo\n"]
    suggestions.append(f"- **Filas:** {n_rows}")
    suggestions.append(f"- **Variables numéricas:** {n_numeric}")
    suggestions.append(f"- **Variables categóricas:** {n_categorical}\n")

    # Verificar normalidad de las variables
    normal_vars = []
    non_normal_vars = []
    for col in numeric_cols.columns:
        data = numeric_cols[col].dropna()
        if len(data) >= 8 and len(data) <= 5000:
            _, p = sp_stats.shapiro(data)
            if p > 0.05:
                normal_vars.append(col)
            else:
                non_normal_vars.append(col)

    if normal_vars:
        suggestions.append(f"Variables con distribución normal: `{'`, `'.join(normal_vars)}`")
    if non_normal_vars:
        suggestions.append(f"Variables NO normales: `{'`, `'.join(non_normal_vars)}`\n")

    suggestions.append("### Modelos Recomendados\n")

    if n_numeric >= 2 and n_categorical == 0:
        if all(c in normal_vars for c in numeric_cols.columns):
            suggestions.append(
                "1. **Regresión Lineal** - Los datos son numéricos y normales. "
                "Ideal para modelar relaciones lineales entre variables."
            )
            suggestions.append(
                "2. **Correlación de Pearson** - Para medir la fuerza de la "
                "relación lineal entre pares de variables."
            )
        else:
            suggestions.append(
                "1. **Regresión Robusta / No paramétrica** - Algunas variables "
                "no siguen distribución normal."
            )
            suggestions.append(
                "2. **Correlación de Spearman** - Alternativa no paramétrica "
                "para medir asociación."
            )

    if n_numeric >= 1 and n_categorical >= 1:
        suggestions.append(
            "3. **ANOVA / Kruskal-Wallis** - Para comparar medias entre "
            "grupos definidos por las variables categóricas."
        )

    if n_numeric == 1 and n_categorical == 0:
        suggestions.append(
            "1. **Análisis descriptivo** - Con una sola variable numérica, "
            "enfócate en la distribución, tendencia central y dispersión."
        )
        if normal_vars:
            suggestions.append(
                "2. **Prueba t de una muestra** - Para contrastar la media "
                "contra un valor teórico."
            )
        else:
            suggestions.append(
                "2. **Prueba de Wilcoxon** - Alternativa no paramétrica para "
                "contrastar la mediana."
            )

    if n_rows > 100 and n_numeric >= 3:
        suggestions.append(
            "4. **Análisis de Componentes Principales (PCA)** - Para reducir "
            "dimensionalidad y encontrar patrones latentes."
        )

    if n_rows > 50:
        suggestions.append(
            "5. **Series temporales (si aplica)** - Si los datos tienen "
            "componente temporal, considera ARIMA o suavizado exponencial."
        )

    return "\n".join(suggestions)


def analyze(query: str, raw_data: str | None = None) -> str:
    """
    Analiza datos y/o responde consultas estadísticas.

    Args:
        query: La pregunta o instrucción del usuario.
        raw_data: Datos en bruto (CSV, números separados por comas, etc.)

    Returns:
        Análisis completo con estadísticas y recomendaciones.
    """
    result_parts = []

    # Si hay datos numéricos, hacer análisis computacional
    if raw_data:
        df = _parse_data(raw_data)
        if df is not None:
            result_parts.append(_descriptive_stats(df))
            result_parts.append(_suggest_model(df))
        else:
            result_parts.append(
                "*No se pudieron parsear los datos. Asegúrate de enviar "
                "números separados por comas, espacios o en formato CSV.*"
            )

    # Complementar con análisis del LLM
    computed_analysis = "\n\n".join(result_parts) if result_parts else ""

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": (
                f"Consulta del usuario: {query}\n\n"
                f"{'Análisis computacional previo:' + chr(10) + computed_analysis if computed_analysis else ''}\n\n"
                f"Basándote en la consulta y los datos (si los hay):\n"
                f"1. Interpreta los resultados estadísticos.\n"
                f"2. Explica qué significan en términos prácticos.\n"
                f"3. Sugiere los siguientes pasos de análisis.\n"
                f"4. Recomienda el modelo estadístico más adecuado y por qué."
            ),
        },
    ]

    llm_analysis = chat(messages, temperature=0.3)

    if computed_analysis:
        return f"{computed_analysis}\n\n---\n\n## Interpretación del Agente Estadístico\n\n{llm_analysis}"
    return llm_analysis
