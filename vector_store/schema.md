# Esquema de Metadatos — SupportMind AI Vector Store

## Colección: `support_knowledge`

Todos los documentos indexados en ChromaDB siguen este esquema de metadatos.
Solo los documentos con `status: verified` son consultados por el bot.

---

## Campos de Metadatos

| Campo | Tipo | Valores Posibles | Descripción |
|---|---|---|---|
| `source` | string | `nombre_archivo.pdf` | Nombre del archivo fuente |
| `status` | string | `verified`, `draft`, `deprecated` | Estado del documento. **Solo `verified` alimenta el RAG.** |
| `category` | string | Ver tabla abajo | Categoría técnica del contenido |
| `page` | integer | 0, 1, 2, ... | Número de página del PDF de origen |
| `created_at` | string | `YYYY-MM-DD` | Fecha de indexación |

---

## Categorías Disponibles

| Valor | Descripción |
|---|---|
| `general` | Conocimiento general de soporte |
| `networking` | Redes, DNS, VPN, firewall, conectividad |
| `hardware` | Diagnóstico y reparación de hardware |
| `software` | Instalación, configuración y bugs de software |
| `security` | Incidentes de seguridad, malware, accesos |
| `cloud` | AWS, GCP, Azure, contenedores, Kubernetes |

---

## Reglas de Negocio

1. **Solo documentos `verified`:** El retriever filtra estrictamente por `status: verified`.
2. **Ciclo de vida:** `draft` → revisión | `verified` → activo en RAG | `deprecated` → desactivado.
3. **Fuentes citables:** El campo `source` permite al bot citar el documento exacto.

---

## Ejemplo de Documento Indexado

```json
{
  "page_content": "Para resolver el error DNS_PROBE_FINISHED_NXDOMAIN...",
  "metadata": {
    "source": "guia_redes_2024.pdf",
    "status": "verified",
    "category": "networking",
    "page": 14,
    "created_at": "2026-03-21"
  }
}
```
