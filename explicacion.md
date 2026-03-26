# SupportMind AI — Explicación del proyecto

## ¿Qué hace?

**SupportMind AI** es una aplicación de asistencia técnica conversacional: simula un “Ingeniero de Soporte Senior” que responde en el idioma del usuario, con tono profesional y pasos numerados. Las respuestas **priorizan** el contenido de una **base de conocimiento interna** construida a partir de PDFs indexados en una base vectorial. Si no hay contexto verificado suficiente, el sistema puede **ampliar** la búsqueda con **Wikipedia** o, en última instancia, con el **conocimiento general del modelo** (GPT), siempre dejando claro en la interficie qué tipo de fuente se usó.

La interfaz es una app **Streamlit** multipágina: una pantalla de **chat** y otra de **gestión de la base de conocimiento** (subida e indexación de PDFs).

---

## Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Lenguaje | Python 3 |
| Interfaz web | Streamlit (aplicación multipágina) |
| Orquestación RAG | LangChain (`ConversationalRetrievalChain`, prompts, memoria) |
| Modelo y embeddings | OpenAI API (`ChatOpenAI`, `OpenAIEmbeddings` vía `langchain-openai`) |
| Almacén vectorial | ChromaDB (persistencia en disco, integración LangChain `Chroma`) |
| Documentos | PDF con `PyPDFLoader` + troceado recursivo de texto |
| Configuración | Variables de entorno con `python-dotenv` |
| Búsqueda externa (fallback) | Wikipedia vía `langchain-community` (`WikipediaAPIWrapper`) y paquete `wikipedia` |
| Conteo de tokens (dependencia declarada) | `tiktoken` |
| Pruebas | `pytest` (usado en `tests/`; no figura en `requirements.txt` — suele instalarse aparte para desarrollo) |

**Servicios externos:** API de OpenAI (obligatorio para chat, embeddings e indexación). No se requiere servidor aparte para Chroma en este diseño: usa almacenamiento local bajo `CHROMA_PERSIST_DIR`.

---

## Librerías Python (`requirements.txt`) y descripción breve

| Paquete | Descripción breve |
|---------|-------------------|
| **langchain** | Framework para cadenas con LLM, plantillas de mensajes, memoria y integración con retrievers. |
| **langchain-openai** | Conectores oficiales LangChain para modelos de chat y embeddings de OpenAI. |
| **langchain-community** | Integraciones comunitarias (p. ej. `Chroma`, cargadores, `WikipediaAPIWrapper`). |
| **chromadb** | Base de datos vectorial embebida; aquí persiste la colección de fragmentos documentales. |
| **streamlit** | Framework para construir la UI web (chat, formularios, métricas) con poco código. |
| **pypdf** | Lectura y extracción de texto de archivos PDF (usado por el cargador de LangChain). |
| **python-dotenv** | Carga variables de entorno desde archivo `.env` para API keys y rutas. |
| **tiktoken** | Tokenizador alineado con modelos OpenAI; útil para límites y costes de tokens. |
| **wikipedia** | Cliente Python para la API de Wikipedia; respalda la búsqueda de fallback. |

*Nota:* Al instalar el entorno pueden añadirse **dependencias transitivas** (por ejemplo para HTTP o parsers HTML) que no aparecen listadas explícitamente en `requirements.txt`.

---

## Programas y archivos relevantes

| Ruta | Función |
|------|---------|
| `ui/app.py` | Página principal: chat, estado de la base, invocación de la cadena RAG y fallback web. |
| `ui/pages/1_Base_de_Conocimiento.py` | Administración: subir PDFs, categorizar, indexar en Chroma y reconstruir la cadena. |
| `core/config.py` | Constantes y configuración desde entorno (modelos, rutas Chroma, tamaños de chunk, etc.). |
| `core/chain.py` | Construcción de `ConversationalRetrievalChain` con prompt de “soporte” y memoria de conversación. |
| `core/loader.py` | Carga de PDF en temporal, metadatos (`source`, `status`, `category`) y división en chunks. |
| `core/search.py` | Fallback: Wikipedia + prompt; si no hay resultados, respuesta con conocimiento del LLM. |
| `vector_store/store.py` | Creación del store Chroma, filtro `status=verified`, retriever y estadísticas. |
| `tests/test_core.py` | Pruebas automatizadas del núcleo (comportamiento esperado del proyecto). |
| `requirements.txt` | Pin de versiones de dependencias principales. |

**Ejecución habitual (desde la raíz del proyecto):**  
`streamlit run ui/app.py`  
(Streamlit descubre automáticamente las páginas en `ui/pages/`.)

---

## Historia corta: qué hace el sistema (en flujo)

Un usuario llega con un problema técnico y escribe en el chat. **SupportMind AI** mira primero en su “cajón” de manuales: fragmentos de PDFs que el equipo subió y marcó como **verificados**, guardados como vectores en **Chroma**. El modelo **recupera** los trozos más parecidos a la pregunta y **redacta** una respuesta guiada, sin inventar más allá de ese contexto. Si el cajón está vacío o la pregunta no encaja con nada verificado, el asistente no se queda mudo: **busca referencias en Wikipedia** o, si hace falta, recurre al **conocimiento general del modelo**, avisando que ya no es la “base interna”. Así, el proyecto narra el mismo arco que un soporte que primero confía en la documentación oficial y solo después mira fuera.
