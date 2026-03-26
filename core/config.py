import os
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
CHROMA_PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", "./vector_store/data")
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "support_knowledge")
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-3.5-turbo")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "text-embedding-ada-002")
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 150
MAX_RETRIEVAL_DOCS = 4
