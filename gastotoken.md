# Análisis de Consumo de Tokens — SupportMind AI

## Dónde se consumen tokens por consulta

### Flujo A — Base de conocimiento interna (caso normal)

```
Usuario escribe pregunta
        │
        ├─► [1] Embedding de la pregunta (text-embedding-ada-002)
        │
        ├─► ChromaDB recupera 4 chunks (MAX_RETRIEVAL_DOCS=4)
        │
        └─► [2] LLM call (gpt-3.5-turbo)
                ├── SYSTEM_PROMPT
                ├── 4 chunks de contexto (CHUNK_SIZE=1000 chars cada uno)
                ├── Historial de conversación (ConversationBufferMemory)
                ├── Pregunta del usuario
                └── Respuesta generada
```

| Componente | Tokens aprox. |
|---|---|
| `[1]` Embedding pregunta | ~15–50 |
| SYSTEM_PROMPT (fijo) | ~180 |
| 4 chunks de contexto | ~800–1,200 |
| Historial conversación | ~200 × N turnos |
| Pregunta usuario | ~20–80 |
| Respuesta generada | ~200–400 |
| **Total turno 1** | **~1,400–1,900 tokens** |
| **Total turno 5** | **~2,200–3,000 tokens** ⚠️ crece con el historial |

---

### Flujo B — Fallback Wikipedia + LLM

Ocurre cuando el LLM responde "No cuento con información verificada...".
Wikipedia aporta hasta 3,000 chars de contexto adicional (~750 tokens).

| Componente | Tokens aprox. |
|---|---|
| WEB_SYSTEM_PROMPT + resultados Wikipedia | ~950 |
| Pregunta usuario | ~50 |
| Respuesta generada | ~300 |
| **Total adicional** | **~1,300 tokens** |

---

### Flujo C — Fallback LLM puro (sin Wikipedia)

Ocurre cuando Wikipedia no encuentra resultados relevantes.

| Componente | Tokens aprox. |
|---|---|
| LLM_FALLBACK_PROMPT | ~130 |
| Pregunta usuario | ~50 |
| Respuesta generada | ~300 |
| **Total** | **~480 tokens** |

---

## Costo estimado en USD

### Tarifas por modelo
| Modelo | Input | Output |
|---|---|---|
| gpt-3.5-turbo | $0.0005 / 1K tokens | $0.0015 / 1K tokens |
| gpt-4o | $0.005 / 1K tokens | $0.015 / 1K tokens |

### Costo por escenario
| Escenario | Tokens | Costo gpt-3.5 | Costo gpt-4o |
|---|---|---|---|
| Turno 1, base interna | ~1,700 | ~$0.0010 | ~$0.010 |
| Turno 5, base interna | ~2,500 | ~$0.0015 | ~$0.015 |
| Fallback Wikipedia | ~3,000 | ~$0.0020 | ~$0.020 |
| 100 consultas/día | ~200K | ~$0.13 | ~$1.30 |
| 1,000 consultas/día | ~2M | ~$1.30 | ~$13.00 |

---

## Riesgo principal: ConversationBufferMemory

La memoria actual guarda **todo el historial sin límite**. El costo crece
linealmente con cada turno y puede alcanzar el límite del contexto:
- gpt-3.5-turbo: 16,385 tokens máx.
- gpt-4o: 128,000 tokens máx.

### Solución recomendada (pendiente de aplicar)
Cambiar a `ConversationBufferWindowMemory(k=5)` en `core/chain.py`
para mantener solo los últimos 5 turnos y estabilizar el costo por consulta.

---

## Parámetros actuales que afectan el gasto
| Parámetro | Archivo | Valor | Impacto |
|---|---|---|---|
| `MAX_RETRIEVAL_DOCS` | `core/config.py` | 4 | 4 chunks × ~250 tokens c/u |
| `CHUNK_SIZE` | `core/config.py` | 1000 | chars por chunk (~250 tokens) |
| `CHUNK_OVERLAP` | `core/config.py` | 150 | chars de solapamiento |
| `doc_content_chars_max` | `core/search.py` | 3000 | chars de Wikipedia (~750 tokens) |
| `LLM_MODEL` | `.env` | gpt-3.5-turbo | define tarifa base |
| `EMBEDDING_MODEL` | `.env` | text-embedding-ada-002 | $0.0001/1K tokens |
