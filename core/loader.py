from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from core.config import CHUNK_SIZE, CHUNK_OVERLAP
import tempfile
import os


def load_and_split_pdf(uploaded_file, status: str = "verified", category: str = "general") -> list:
    """
    Recibe un archivo PDF (BytesIO de Streamlit), lo guarda temporalmente,
    lo carga con PyPDFLoader y lo divide en chunks con metadatos.
    """
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(uploaded_file.read())
        tmp_path = tmp.name

    try:
        loader = PyPDFLoader(tmp_path)
        pages = loader.load()

        for page in pages:
            page.metadata["source"] = uploaded_file.name
            page.metadata["status"] = status
            page.metadata["category"] = category

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=CHUNK_SIZE,
            chunk_overlap=CHUNK_OVERLAP,
        )
        chunks = splitter.split_documents(pages)
        return chunks
    finally:
        os.unlink(tmp_path)
