# PROJECT_PLAN.md — supportmindai
**Fecha:** 2026-03-21
**Arquitecto:** Lead Architect Agent

---

## Visión General
**supportmindai** es un bot de soporte técnico conversacional basado en RAG (Retrieval-Augmented Generation). Actúa como un Ingeniero de Soporte Senior: cortés, preciso y guiado por una base de conocimiento vectorial. Nunca inventa información que no esté en la base de conocimiento.

---

## Stack Tecnológico
| Capa | Tecnología |
|---|---|
| Lenguaje | Python 3.11 |
| LLM Orchestration | LangChain (ConversationalRetrievalChain) |
| UI | Streamlit (st.chat_message, file uploader) |
| Vector Store | ChromaDB |
| Embeddings | OpenAI text-embedding-ada-002 |
| LLM Backend | OpenAI GPT (configurable) |

---

## Estructura de Carpetas
```
supportmindai/
├── PROJECT_PLAN.md          # Este archivo — memoria del proyecto
├── requirements.txt         # Dependencias del proyecto
├── .env.example             # Variables de entorno requeridas
├── core/
│   ├── __init__.py
│   ├── chain.py             # ConversationalRetrievalChain + prompt de personalidad
│   ├── loader.py            # Carga y chunking de documentos PDF
│   └── config.py            # Configuración global (modelos, rutas, parámetros)
├── ui/
│   ├── __init__.py
│   └── app.py               # Interfaz Streamlit: chat + cargador de PDFs
└── vector_store/
    ├── __init__.py
    ├── store.py             # Inicialización y gestión de ChromaDB
    └── schema.md            # Esquema de metadatos (status: verified, source, etc.)
```

---

## Fases de Desarrollo

### Fase 1 — Scaffolding (Actual)
- [x] Crear estructura de carpetas
- [ ] Crear `requirements.txt`
- [ ] Crear `.env.example`
- [ ] Implementar `core/config.py`
- [ ] Implementar `core/loader.py`
- [ ] Implementar `core/chain.py`
- [ ] Implementar `vector_store/store.py`
- [ ] Implementar `ui/app.py`

### Fase 2 — Integración y Pruebas
- [ ] Pruebas de ingesta de PDFs
- [ ] Pruebas de retrieval con ChromaDB
- [ ] Validación de la cadena conversacional
- [ ] Pruebas E2E de la UI

### Fase 3 — Personalidad y Calidad
- [ ] Ajuste fino del system prompt (Ingeniero de Soporte Senior)
- [ ] Validación de que el bot no alucina fuera del contexto
- [ ] Filtrado por `status: verified` en metadatos

---

## Decisiones de Arquitectura

### Personalidad del Bot
El bot se identifica como un **Ingeniero de Soporte Senior** con las siguientes reglas:
1. Siempre responde en el idioma del usuario.
2. Guía paso a paso con instrucciones numeradas.
3. Si la respuesta no está en la base vectorial, lo dice explícitamente y escala.
4. Tono: profesional, empático y paciente.
5. Solo usa información de documentos con metadato `status: verified`.

### Esquema de Metadatos ChromaDB
```json
{
  "source": "nombre_del_archivo.pdf",
  "status": "verified",       // solo documentos verificados alimentan el RAG
  "category": "networking",   // categoría técnica del problema
  "created_at": "2026-03-21"
}
```

### Flujo de Datos
```
PDF Upload → Loader → Chunking → Embeddings → ChromaDB
                                                    ↓
User Query → ConversationalRetrievalChain → Retrieval → LLM → Response
```

---

## Variables de Entorno Requeridas
```
OPENAI_API_KEY=sk-...
CHROMA_PERSIST_DIR=./vector_store/data
COLLECTION_NAME=support_knowledge
```

---

## Agentes Asignados
| Agente | Responsabilidad | Módulos |
|---|---|---|
| Core-Dev | Lógica de negocio y RAG chain | `core/` |
| UI-Expert | Interfaz Streamlit | `ui/` |
| Knowledge-Master | Vector store y esquema de datos | `vector_store/` |
