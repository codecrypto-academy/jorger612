import streamlit as st
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from core.loader import load_and_split_pdf
from core.chain import build_chain
from vector_store.store import get_or_create_store, add_documents_to_store, get_verified_retriever, get_collection_stats

# ── Configuración de la página ───────────────────────────────────────────────
st.set_page_config(
    page_title="Base de Conocimiento — SupportMind AI",
    page_icon="📚",
    layout="wide",
)

st.markdown("""
<style>
    .main-header { font-size: 2rem; font-weight: 700; color: #1f77b4; margin-bottom: 0.2rem; }
    .sub-header  { font-size: 1rem; color: #666; margin-bottom: 1.5rem; }
</style>
""", unsafe_allow_html=True)

st.markdown('<div class="main-header">📚 Base de Conocimiento</div>', unsafe_allow_html=True)
st.markdown('<div class="sub-header">Gestión de documentos verificados · SupportMind AI</div>', unsafe_allow_html=True)
st.divider()

# ── Estado actual de la colección ────────────────────────────────────────────
st.subheader("Estado actual")
try:
    store = get_or_create_store()
    stats = get_collection_stats(store)
    col1, col2, col3 = st.columns(3)
    col1.metric("Fragmentos indexados", stats["total_documents"])
    col2.metric("Colección", stats["collection_name"])
    col3.metric("Estado", "🟢 Activa" if stats["total_documents"] > 0 else "🔴 Vacía")
except Exception as e:
    st.error(f"No se pudo conectar con ChromaDB: {e}")

st.divider()

# ── Formulario de carga ───────────────────────────────────────────────────────
st.subheader("Subir nuevos documentos")
st.caption("Solo se indexarán documentos con status `verified`. Formatos soportados: PDF.")

col_left, col_right = st.columns([2, 1])

with col_left:
    uploaded_files = st.file_uploader(
        "Selecciona uno o varios archivos PDF",
        type=["pdf"],
        accept_multiple_files=True,
    )

with col_right:
    category = st.selectbox(
        "Categoría técnica",
        ["general", "networking", "hardware", "software", "security", "cloud"],
        help="Clasifica el contenido del documento para mejor recuperación.",
    )
    st.caption("Esta categoría se aplicará a todos los archivos subidos en este lote.")

if uploaded_files:
    st.info(f"**{len(uploaded_files)} archivo(s) seleccionado(s):** {', '.join(f.name for f in uploaded_files)}")

if st.button("📥 Procesar e Indexar", type="primary", disabled=not uploaded_files):
    with st.spinner("Procesando y generando embeddings..."):
        try:
            store = get_or_create_store()
            all_chunks = []
            progress = st.progress(0, text="Iniciando...")

            for i, pdf in enumerate(uploaded_files):
                progress.progress((i / len(uploaded_files)), text=f"Procesando: {pdf.name}")
                chunks = load_and_split_pdf(pdf, status="verified", category=category)
                all_chunks.extend(chunks)

            progress.progress(0.9, text="Indexando en ChromaDB...")
            add_documents_to_store(store, all_chunks)

            # Actualizar la chain en session_state para que el chat la use de inmediato
            retriever = get_verified_retriever(store)
            st.session_state.chain = build_chain(retriever)
            st.session_state.store_initialized = True

            progress.progress(1.0, text="¡Completado!")
            st.success(f"✅ **{len(all_chunks)} fragmentos** indexados correctamente desde {len(uploaded_files)} archivo(s).")

            # Mostrar stats actualizadas
            updated_stats = get_collection_stats(store)
            st.info(f"Total en la base de conocimiento: **{updated_stats['total_documents']} fragmentos**")

        except Exception as e:
            st.error(f"Error durante la indexación: {e}")

st.divider()

# ── Documentos actualmente indexados ─────────────────────────────────────────
st.subheader("Documentos en la base de conocimiento")
try:
    store = get_or_create_store()
    collection = store._collection
    if collection.count() == 0:
        st.info("La base de conocimiento está vacía. Sube documentos para comenzar.")
    else:
        results = collection.get(include=["metadatas"])
        # Agrupar por fuente
        sources: dict = {}
        for meta in results["metadatas"]:
            src = meta.get("source", "Desconocido")
            cat = meta.get("category", "general")
            status = meta.get("status", "unknown")
            if src not in sources:
                sources[src] = {"chunks": 0, "category": cat, "status": status}
            sources[src]["chunks"] += 1

        for src, info in sources.items():
            with st.expander(f"📄 {src}"):
                c1, c2, c3 = st.columns(3)
                c1.metric("Fragmentos", info["chunks"])
                c2.metric("Categoría", info["category"])
                c3.metric("Status", info["status"])
except Exception as e:
    st.error(f"Error al consultar la colección: {e}")
