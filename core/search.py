from langchain_community.utilities import WikipediaAPIWrapper
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from core.config import OPENAI_API_KEY, LLM_MODEL


WEB_SYSTEM_PROMPT = """Eres un Ingeniero de Soporte Senior altamente experimentado y muy cortés. \
Tu nombre es SupportMind AI.

La base de conocimiento interna no contenía información verificada sobre esta consulta. \
Usaste fuentes externas para responder. Información de referencia encontrada:

{search_results}

REGLAS:
1. Responde SIEMPRE en el idioma del usuario.
2. Guía paso a paso con instrucciones numeradas y claras.
3. Indica EXPLÍCITAMENTE al inicio que la respuesta NO proviene de la base de conocimiento \
   interna verificada, sino de fuentes externas o tu conocimiento de entrenamiento.
4. Sé empático, paciente y profesional.
5. Al finalizar, pregunta: "¿Esto resolvió tu problema o necesitas más ayuda?"
"""

LLM_FALLBACK_PROMPT = """Eres un Ingeniero de Soporte Senior altamente experimentado y muy cortés. \
Tu nombre es SupportMind AI.

La base de conocimiento interna no contenía información sobre esta consulta. \
Responde usando tu conocimiento de entrenamiento.

REGLAS:
1. Responde SIEMPRE en el idioma del usuario.
2. Guía paso a paso con instrucciones numeradas y claras.
3. Indica EXPLÍCITAMENTE al inicio que esta respuesta proviene de tu conocimiento general \
   de entrenamiento, no de la base de conocimiento verificada interna.
4. Si no estás seguro de algo, dilo claramente.
5. Sé empático, paciente y profesional.
6. Al finalizar, pregunta: "¿Esto resolvió tu problema o necesitas más ayuda?"
"""


def _wikipedia_search(query: str) -> str | None:
    """Busca en Wikipedia. Retorna texto o None si no hay resultados útiles."""
    try:
        wiki = WikipediaAPIWrapper(top_k_results=2, doc_content_chars_max=3000)
        result = wiki.run(query)
        if result and "No good Wikipedia Search Result was found" not in result:
            return result
        return None
    except Exception:
        return None


def web_search_fallback(query: str) -> tuple[str, list[str]]:
    """
    Fallback cuando ChromaDB no tiene info relevante.
    Intenta Wikipedia primero; si falla, usa conocimiento de entrenamiento del LLM.
    Retorna (respuesta, fuentes).
    """
    llm = ChatOpenAI(
        model_name=LLM_MODEL,
        openai_api_key=OPENAI_API_KEY,
        temperature=0.2,
    )

    wiki_results = _wikipedia_search(query)

    if wiki_results:
        prompt = ChatPromptTemplate.from_messages([
            ("system", WEB_SYSTEM_PROMPT),
            ("human", "{question}"),
        ])
        chain = prompt | llm
        response = chain.invoke({
            "search_results": wiki_results,
            "question": query,
        })
        return response.content, ["🌐 Wikipedia"]

    # Fallback final: conocimiento de entrenamiento del LLM
    prompt = ChatPromptTemplate.from_messages([
        ("system", LLM_FALLBACK_PROMPT),
        ("human", "{question}"),
    ])
    chain = prompt | llm
    response = chain.invoke({"question": query})
    return response.content, ["🧠 Conocimiento de entrenamiento (GPT)"]
