"""
Suite de pruebas para supportmindai — Fase 2: Integración y Validación
Cubre: config, loader, chain (mocked), vector_store (mocked)
"""
import sys
import os
import pytest
import tempfile
from unittest.mock import MagicMock, patch

# Asegurar que el root del proyecto esté en el path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))


# ──────────────────────────────────────────────────────────────
# 1. Tests de Configuración
# ──────────────────────────────────────────────────────────────
class TestConfig:
    def test_config_imports(self):
        """config.py debe importar sin errores."""
        from core import config
        assert hasattr(config, "OPENAI_API_KEY")
        assert hasattr(config, "CHROMA_PERSIST_DIR")
        assert hasattr(config, "COLLECTION_NAME")
        assert hasattr(config, "LLM_MODEL")
        assert hasattr(config, "EMBEDDING_MODEL")

    def test_config_defaults(self):
        """Los valores por defecto deben ser coherentes."""
        from core.config import CHUNK_SIZE, CHUNK_OVERLAP, MAX_RETRIEVAL_DOCS
        assert CHUNK_SIZE > 0
        assert CHUNK_OVERLAP > 0
        assert CHUNK_OVERLAP < CHUNK_SIZE
        assert MAX_RETRIEVAL_DOCS > 0

    def test_chroma_persist_dir_has_value(self):
        """CHROMA_PERSIST_DIR no debe estar vacío."""
        from core.config import CHROMA_PERSIST_DIR
        assert isinstance(CHROMA_PERSIST_DIR, str)
        assert len(CHROMA_PERSIST_DIR) > 0

    def test_collection_name_has_value(self):
        """COLLECTION_NAME no debe estar vacío."""
        from core.config import COLLECTION_NAME
        assert isinstance(COLLECTION_NAME, str)
        assert len(COLLECTION_NAME) > 0


# ──────────────────────────────────────────────────────────────
# 2. Tests del Loader (PDF chunking)
# ──────────────────────────────────────────────────────────────
class TestLoader:
    def test_loader_imports(self):
        """loader.py debe importar sin errores."""
        from core.loader import load_and_split_pdf
        assert callable(load_and_split_pdf)

    def test_loader_with_mock_pdf(self):
        """load_and_split_pdf debe devolver una lista de chunks con metadatos correctos."""
        from core.loader import load_and_split_pdf
        from langchain.schema import Document

        mock_page = Document(
            page_content="Paso 1: Reinicia el router. Paso 2: Verifica el cable. Paso 3: Llama al ISP.",
            metadata={"page": 0}
        )

        mock_file = MagicMock()
        mock_file.name = "guia_redes.pdf"
        mock_file.read.return_value = b"%PDF-1.4 fake content"

        with patch("core.loader.PyPDFLoader") as mock_loader_cls, \
             patch("core.loader.tempfile.NamedTemporaryFile") as mock_tmp, \
             patch("core.loader.os.unlink"):

            mock_tmp_instance = MagicMock()
            mock_tmp_instance.__enter__ = MagicMock(return_value=mock_tmp_instance)
            mock_tmp_instance.__exit__ = MagicMock(return_value=False)
            mock_tmp_instance.name = "/tmp/fake.pdf"
            mock_tmp.return_value = mock_tmp_instance

            mock_loader_instance = MagicMock()
            mock_loader_instance.load.return_value = [mock_page]
            mock_loader_cls.return_value = mock_loader_instance

            chunks = load_and_split_pdf(mock_file, status="verified", category="networking")

        assert isinstance(chunks, list)
        assert len(chunks) > 0
        for chunk in chunks:
            assert chunk.metadata.get("source") == "guia_redes.pdf"
            assert chunk.metadata.get("status") == "verified"
            assert chunk.metadata.get("category") == "networking"

    def test_loader_default_status_is_verified(self):
        """El status por defecto debe ser 'verified'."""
        from core.loader import load_and_split_pdf
        from langchain.schema import Document

        mock_page = Document(page_content="Contenido de prueba para el test.", metadata={"page": 0})
        mock_file = MagicMock()
        mock_file.name = "test.pdf"
        mock_file.read.return_value = b"%PDF fake"

        with patch("core.loader.PyPDFLoader") as mock_loader_cls, \
             patch("core.loader.tempfile.NamedTemporaryFile") as mock_tmp, \
             patch("core.loader.os.unlink"):

            mock_tmp_instance = MagicMock()
            mock_tmp_instance.__enter__ = MagicMock(return_value=mock_tmp_instance)
            mock_tmp_instance.__exit__ = MagicMock(return_value=False)
            mock_tmp_instance.name = "/tmp/fake2.pdf"
            mock_tmp.return_value = mock_tmp_instance

            mock_loader_instance = MagicMock()
            mock_loader_instance.load.return_value = [mock_page]
            mock_loader_cls.return_value = mock_loader_instance

            chunks = load_and_split_pdf(mock_file)

        for chunk in chunks:
            assert chunk.metadata.get("status") == "verified"


# ──────────────────────────────────────────────────────────────
# 3. Tests del Chain (RAG chain)
# ──────────────────────────────────────────────────────────────
class TestChain:
    def test_chain_imports(self):
        """chain.py debe importar sin errores."""
        from core.chain import build_chain, build_prompt
        assert callable(build_chain)
        assert callable(build_prompt)

    def test_build_prompt_has_context_and_question(self):
        """El prompt debe contener las variables {context} y {question}."""
        from core.chain import build_prompt
        prompt = build_prompt()
        # Verificar que el prompt contiene las variables necesarias
        input_vars = prompt.input_variables
        assert "context" in input_vars or any("context" in str(m) for m in prompt.messages)
        assert "question" in input_vars or any("question" in str(m) for m in prompt.messages)

    def test_system_prompt_contains_persona(self):
        """El SYSTEM_PROMPT debe contener las reglas clave de la personalidad."""
        from core.chain import SYSTEM_PROMPT
        assert "Ingeniero de Soporte Senior" in SYSTEM_PROMPT
        assert "NUNCA" in SYSTEM_PROMPT or "nunca" in SYSTEM_PROMPT
        assert "paso a paso" in SYSTEM_PROMPT or "step" in SYSTEM_PROMPT.lower()

    def test_build_chain_with_mock_retriever(self):
        """build_chain debe construir una cadena válida con un retriever mockeado."""
        from core.chain import build_chain

        mock_retriever = MagicMock()

        with patch("core.chain.ChatOpenAI") as mock_llm_cls, \
             patch("core.chain.ConversationBufferMemory") as mock_mem_cls, \
             patch("core.chain.ConversationalRetrievalChain.from_llm") as mock_from_llm:

            mock_chain = MagicMock()
            mock_from_llm.return_value = mock_chain

            result = build_chain(mock_retriever)

        assert result == mock_chain
        mock_from_llm.assert_called_once()


# ──────────────────────────────────────────────────────────────
# 4. Tests del Vector Store
# ──────────────────────────────────────────────────────────────
class TestVectorStore:
    def test_store_imports(self):
        """store.py debe importar sin errores."""
        from vector_store.store import (
            get_or_create_store,
            add_documents_to_store,
            get_verified_retriever,
            get_collection_stats,
        )
        assert callable(get_or_create_store)
        assert callable(add_documents_to_store)
        assert callable(get_verified_retriever)
        assert callable(get_collection_stats)

    def test_add_documents_rejects_unverified(self):
        """add_documents_to_store debe lanzar ValueError si no hay docs verificados."""
        from vector_store.store import add_documents_to_store
        from langchain.schema import Document

        mock_store = MagicMock()
        unverified_docs = [
            Document(page_content="Draft content", metadata={"status": "draft"}),
            Document(page_content="Old content", metadata={"status": "deprecated"}),
        ]

        with pytest.raises(ValueError, match="verified"):
            add_documents_to_store(mock_store, unverified_docs)

    def test_add_documents_accepts_verified(self):
        """add_documents_to_store debe aceptar y persistir docs verificados."""
        from vector_store.store import add_documents_to_store
        from langchain.schema import Document

        mock_store = MagicMock()
        verified_docs = [
            Document(page_content="Solución verificada para error de red.", metadata={"status": "verified"}),
        ]

        add_documents_to_store(mock_store, verified_docs)

        mock_store.add_documents.assert_called_once_with(verified_docs)
        mock_store.persist.assert_called_once()

    def test_verified_retriever_filters_by_status(self):
        """get_verified_retriever debe configurar el filtro status=verified."""
        from vector_store.store import get_verified_retriever

        mock_store = MagicMock()
        mock_retriever = MagicMock()
        mock_store.as_retriever.return_value = mock_retriever

        result = get_verified_retriever(mock_store)

        mock_store.as_retriever.assert_called_once()
        call_kwargs = mock_store.as_retriever.call_args[1]
        assert call_kwargs["search_kwargs"]["filter"]["status"] == "verified"
        assert result == mock_retriever

    def test_collection_stats_returns_dict(self):
        """get_collection_stats debe retornar un dict con las claves esperadas."""
        from vector_store.store import get_collection_stats

        mock_store = MagicMock()
        mock_store._collection.count.return_value = 42

        stats = get_collection_stats(mock_store)

        assert isinstance(stats, dict)
        assert "collection_name" in stats
        assert "total_documents" in stats
        assert stats["total_documents"] == 42


# ──────────────────────────────────────────────────────────────
# 5. Test de Estructura de Archivos
# ──────────────────────────────────────────────────────────────
class TestProjectStructure:
    BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

    def test_required_files_exist(self):
        """Todos los archivos críticos del proyecto deben existir."""
        required = [
            "requirements.txt",
            ".env.example",
            "PROJECT_PLAN.md",
            "core/__init__.py",
            "core/config.py",
            "core/loader.py",
            "core/chain.py",
            "ui/__init__.py",
            "ui/app.py",
            "vector_store/__init__.py",
            "vector_store/store.py",
            "vector_store/schema.md",
        ]
        for rel_path in required:
            full_path = os.path.join(self.BASE, rel_path)
            assert os.path.isfile(full_path), f"Archivo faltante: {rel_path}"

    def test_data_directory_exists(self):
        """El directorio vector_store/data/ debe existir."""
        data_dir = os.path.join(self.BASE, "vector_store", "data")
        assert os.path.isdir(data_dir)

    def test_requirements_contains_key_deps(self):
        """requirements.txt debe contener las dependencias clave."""
        req_path = os.path.join(self.BASE, "requirements.txt")
        with open(req_path) as f:
            content = f.read()
        for dep in ["langchain", "chromadb", "streamlit", "pypdf", "openai"]:
            assert dep in content, f"Dependencia faltante en requirements.txt: {dep}"
