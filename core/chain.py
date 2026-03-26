from langchain.chains import ConversationalRetrievalChain
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain.prompts import SystemMessagePromptTemplate, HumanMessagePromptTemplate, ChatPromptTemplate
from langchain.memory import ConversationBufferMemory
from core.config import OPENAI_API_KEY, LLM_MODEL, EMBEDDING_MODEL, MAX_RETRIEVAL_DOCS


SYSTEM_PROMPT = """Eres un Ingeniero de Soporte Senior altamente experimentado y muy cortés. \
Tu nombre es SupportMind AI.

REGLAS DE COMPORTAMIENTO:
1. Responde SIEMPRE en el idioma del usuario.
2. Guía paso a paso con instrucciones numeradas y claras.
3. NUNCA inventes información. Si la respuesta no está en el contexto proporcionado, \
   responde exactamente: "No cuento con información verificada sobre esto en mi base de conocimiento. \
   Te recomiendo escalar este caso a un especialista."
4. Sé empático, paciente y profesional en todo momento.
5. Si el contexto contiene la solución, cítala con precisión.
6. Al finalizar cada respuesta, pregunta: "¿Esto resolvió tu problema o necesitas más ayuda?"

CONTEXTO DE CONOCIMIENTO VERIFICADO:
{context}
"""

HUMAN_PROMPT = "{question}"


def build_prompt() -> ChatPromptTemplate:
    messages = [
        SystemMessagePromptTemplate.from_template(SYSTEM_PROMPT),
        HumanMessagePromptTemplate.from_template(HUMAN_PROMPT),
    ]
    return ChatPromptTemplate.from_messages(messages)


def build_chain(retriever) -> ConversationalRetrievalChain:
    """
    Construye la ConversationalRetrievalChain con el retriever de ChromaDB,
    la personalidad de Ingeniero de Soporte Senior y memoria conversacional.
    """
    llm = ChatOpenAI(
        model_name=LLM_MODEL,
        openai_api_key=OPENAI_API_KEY,
        temperature=0.1,
    )

    memory = ConversationBufferMemory(
        memory_key="chat_history",
        return_messages=True,
        output_key="answer",
    )

    chain = ConversationalRetrievalChain.from_llm(
        llm=llm,
        retriever=retriever,
        memory=memory,
        combine_docs_chain_kwargs={"prompt": build_prompt()},
        return_source_documents=True,
        output_key="answer",
    )
    return chain
