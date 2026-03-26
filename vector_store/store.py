import os
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from core.config import (
    OPENAI_API_KEY,
    CHROMA_PERSIST_DIR,
    COLLECTION_NAME,
    EMBEDDING_MODEL,
    MAX_RETRIEVAL_DOCS,
)


def _get_embeddings() -> OpenAIEmbeddings:
    return OpenAIEmbeddings(
        model=EMBEDDING_MODEL,
        openai_api_key=OPENAI_API_KEY,
    )


def get_or_create_store() -> Chroma:
    """
    Inicializa o carga el vector store persistente de ChromaDB.
    Si ya existe data en CHROMA_PERSIST_DIR, la carga.
    """
    os.makedirs(CHROMA_PERSIST_DIR, exist_ok=True)

    store = Chroma(
        collection_name=COLLECTION_NAME,
        embedding_function=_get_embeddings(),
        persist_directory=CHROMA_PERSIST_DIR,
        collection_metadata={"hnsw:space": "cosine"},
    )
    return store


def add_documents_to_store(store: Chroma, documents: list) -> None:
    """
    Agrega documentos al vector store y persiste los cambios.
    Solo acepta documentos con metadato status='verified'.
    """
    verified_docs = [
        doc for doc in documents
        if doc.metadata.get("status") == "verified"
    ]
    if not verified_docs:
        raise ValueError("No hay documentos con status='verified' para indexar.")

    store.add_documents(verified_docs)
    store.persist()


def get_verified_retriever(store: Chroma):
    """
    Retorna un retriever configurado para buscar SOLO en documentos verificados,
    usando similaridad coseno y los primeros MAX_RETRIEVAL_DOCS resultados.
    """
    retriever = store.as_retriever(
        search_type="similarity",
        search_kwargs={
            "k": MAX_RETRIEVAL_DOCS,
            "filter": {"status": "verified"},
        },
    )
    return retriever


def get_collection_stats(store: Chroma) -> dict:
    """
    Retorna estadísticas básicas de la colección para diagnóstico.
    """
    collection = store._collection
    count = collection.count()
    return {
        "collection_name": COLLECTION_NAME,
        "total_documents": count,
        "persist_dir": CHROMA_PERSIST_DIR,
    }
