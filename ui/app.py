import streamlit as st
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from core.chain import build_chain
from core.search import web_search_fallback
from vector_store.store import get_or_create_store, get_verified_retriever, get_collection_stats

# ── Configuración de la página ───────────────────────────────────────────────
st.set_page_config(
    page_title="SupportMind AI",
    page_icon="🛠️",
    layout="wide",
)

st.markdown("""
<style>
    .main-header { font-size: 2rem; font-weight: 700; color: #1f77b4; margin-bottom: 0.2rem; }
    .sub-header  { font-size: 1rem; color: #666; margin-bottom: 1.5rem; }
    .stChatMessage { border-radius: 12px; }
    [data-testid="stSidebar"]        { display: none; }
    [data-testid="collapsedControl"] { display: none; }
</style>
""", unsafe_allow_html=True)

st.markdown('<div class="main-header">🛠️ SupportMind AI</div>', unsafe_allow_html=True)
st.markdown('<div class="sub-header">Ingeniero de Soporte Senior · Respuestas basadas en conocimiento verificado</div>', unsafe_allow_html=True)
st.divider()

# ── Estado de sesión ─────────────────────────────────────────────────────────
if "messages" not in st.session_state:
    st.session_state.messages = []
if "chain" not in st.session_state:
    st.session_state.chain = None
if "store_initialized" not in st.session_state:
    st.session_state.store_initialized = False

# ── Auto-carga silenciosa de la base de conocimiento ────────────────────────
if not st.session_state.store_initialized:
    try:
        store = get_or_create_store()
        if store._collection.count() > 0:
            retriever = get_verified_retriever(store)
            st.session_state.chain = build_chain(retriever)
            st.session_state.store_initialized = True
    except Exception:
        pass

# ── Sidebar: solo estado y navegación ───────────────────────────────────────
with st.sidebar:
    st.header("🛠️ SupportMind AI")
    st.divider()

    if st.session_state.store_initialized:
        try:
            store = get_or_create_store()
            stats = get_collection_stats(store)
            st.success("🟢 Base de conocimiento activa")
            st.caption(f"📦 {stats['total_documents']} fragmentos indexados")
        except Exception:
            st.success("🟢 Base de conocimiento activa")
    else:
        st.warning("🔴 Base de conocimiento no inicializada")
        st.caption("Ve a **📚 Base de Conocimiento** para subir documentos.")

    st.divider()
    if st.button("🗑️ Limpiar Chat", use_container_width=True):
        st.session_state.messages = []
        st.rerun()

# ── Área de chat ─────────────────────────────────────────────────────────────
with st.container():
    if not st.session_state.messages:
        with st.chat_message("assistant"):
            st.markdown(
                "👋 **¡Hola! Soy SupportMind AI**, tu Ingeniero de Soporte Senior.\n\n"
                "Estoy listo para ayudarte. Describe tu problema técnico y te guiaré paso a paso."
            )

    for msg in st.session_state.messages:
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])
            if msg.get("sources"):
                icon = "🌐" if any("Wikipedia" in s or "GPT" in s for s in msg["sources"]) else "📄"
                with st.expander(f"{icon} Fuentes consultadas"):
                    for src in msg["sources"]:
                        st.caption(f"- {src}")

# ── Input del usuario ────────────────────────────────────────────────────────
if prompt := st.chat_input("Describe tu problema técnico aquí..."):
    if not st.session_state.store_initialized or st.session_state.chain is None:
        st.warning("⚠️ La base de conocimiento no está activa. Ve a **📚 Base de Conocimiento** para subir documentos.")
    else:
        st.session_state.messages.append({"role": "user", "content": prompt})
        with st.chat_message("user"):
            st.markdown(prompt)

        with st.chat_message("assistant"):
            try:
                with st.spinner("Consultando la base de conocimiento..."):
                    result = st.session_state.chain({"question": prompt})
                    answer = result.get("answer", "No pude procesar tu consulta.")
                    source_docs = result.get("source_documents", [])
                    sources = []
                    for doc in source_docs:
                        src = doc.metadata.get("source", "Desconocido")
                        if src not in sources:
                            sources.append(src)

                NO_INFO_SIGNAL = "No cuento con información verificada"
                if not source_docs or NO_INFO_SIGNAL in answer:
                    with st.spinner("🌐 Buscando en fuentes externas..."):
                        answer, sources = web_search_fallback(prompt)

                st.markdown(answer)
                if sources:
                    icon = "🌐" if any("Wikipedia" in s or "GPT" in s for s in sources) else "📄"
                    with st.expander(f"{icon} Fuentes consultadas"):
                        for src in sources:
                            st.caption(f"- {src}")

                st.session_state.messages.append({
                    "role": "assistant",
                    "content": answer,
                    "sources": sources,
                })
            except Exception as e:
                error_msg = f"⚠️ Error al procesar tu consulta: {str(e)}"
                st.error(error_msg)
                st.session_state.messages.append({"role": "assistant", "content": error_msg})
