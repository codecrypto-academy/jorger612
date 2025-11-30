# 🔗 Integración Backend Python + Frontend Next.js

## 📋 Resumen de la Integración

Este proyecto ahora integra completamente el backend Python (AWS Rekognition) con el frontend Next.js, creando un sistema de reconocimiento facial completo.

## 🏗️ Arquitectura del Sistema

```
┌─────────────────┐    HTTP POST    ┌─────────────────┐    Python    ┌─────────────────┐
│   Frontend      │ ──────────────→ │   Next.js API   │ ───────────→ │   AWS           │
│   Next.js       │                 │   Route         │              │   Rekognition   │
│   (React)       │                 │   /api/analyze  │              │                 │
└─────────────────┘                 └─────────────────┘              └─────────────────┘
         │                                   │                                │
         │                                   │                                │
         │                                   ▼                                │
         │                          ┌─────────────────┐                        │
         │                          │   Python        │                        │
         │                          │   Script        │                        │
         │                          │   (reconocimiento_api.py)               │
         │                          └─────────────────┘                        │
         │                                   │                                │
         │                                   ▼                                │
         │                          ┌─────────────────┐                        │
         │                          │   Resultado     │                        │
         │                          │   JSON          │                        │
         │                          └─────────────────┘                        │
         │                                   │                                │
         │                                   ▼                                │
         │                          ┌─────────────────┐                        │
         │                          │   Frontend      │                        │
         │                          │   Actualizado   │                        │
         │                          └─────────────────┘                        │
         └─────────────────────────────────────────────────────────────────────┘
```

## 🚀 Flujo de Funcionamiento

### 1. **Captura de Video**
- El usuario activa la cámara en el frontend
- Se detecta un rostro usando algoritmos de detección local
- El botón "Iniciar Análisis" se habilita

### 2. **Análisis de 30 Segundos**
- Al hacer clic en "Iniciar Análisis", se captura un frame del video
- La imagen se convierte a base64 y se envía al backend
- Se inicia un timer visual de 30 segundos

### 3. **Procesamiento Backend**
- Next.js recibe la imagen y la guarda temporalmente
- Se ejecuta el script Python `reconocimiento_api.py`
- Python envía la imagen a AWS Rekognition
- Se analizan emociones, género y edad

### 4. **Resultados**
- Los resultados se devuelven al frontend
- Se actualiza la interfaz con datos reales
- Se muestra el historial de emociones

## 📁 Archivos de Integración

### **Frontend (Next.js)**
- `src/app/api/analyze-face/route.ts` - API endpoint
- `src/components/VideoFeed.tsx` - Captura y envío de imágenes
- `src/app/page.tsx` - Manejo de estado y datos del backend

### **Backend (Python)**
- `reconocimiento_api.py` - Script modificado para API
- `config.env` - Configuración de AWS

## ⚙️ Configuración Requerida

### 1. **Variables de Entorno AWS**
```bash
# Editar config.env
AWS_ACCESS_KEY_ID=tu_access_key_aqui
AWS_SECRET_ACCESS_KEY=tu_secret_key_aqui
AWS_DEFAULT_REGION=us-east-1
```

### 2. **Activar Entorno Virtual Python**
```bash
cd ..  # Ir al directorio padre
.\venv\Scripts\Activate.ps1
```

### 3. **Verificar Dependencias Python**
```bash
pip list | findstr boto3
pip list | findstr opencv
```

## 🔧 Uso del Sistema Integrado

### **Paso 1: Configurar AWS**
1. Crear cuenta AWS y habilitar Rekognition
2. Generar credenciales IAM
3. Editar `config.env` con tus credenciales

### **Paso 2: Ejecutar Backend Python**
```bash
cd ..
.\venv\Scripts\Activate.ps1
python reconocimiento_api.py --image test_image.jpg
```

### **Paso 3: Ejecutar Frontend Next.js**
```bash
cd scaneonextjs
npm run dev
```

### **Paso 4: Usar la Aplicación**
1. Abrir `http://localhost:3000`
2. Activar cámara
3. Posicionar rostro
4. Hacer clic en "Iniciar Análisis (30s)"
5. Ver resultados reales de AWS Rekognition

## 🐛 Solución de Problemas

### **Error: "No se encontraron credenciales de AWS"**
- Verificar que `config.env` esté configurado
- Activar el entorno virtual Python
- Ejecutar `aws configure` manualmente

### **Error: "ModuleNotFoundError: No module named 'boto3'"**
```bash
cd ..
.\venv\Scripts\Activate.ps1
pip install boto3 opencv-python
```

### **Error: "Error en el análisis del backend"**
- Verificar que Python esté en el PATH
- Verificar que `reconocimiento_api.py` exista
- Revisar logs de la consola del navegador

### **La cámara no funciona**
- Verificar permisos del navegador
- Usar HTTPS en producción
- Verificar que no haya otra aplicación usando la cámara

## 📊 Ventajas de la Integración

### ✅ **Frontend (Next.js)**
- Interfaz moderna y responsive
- Detección facial en tiempo real
- Manejo de estado robusto
- TypeScript para mayor seguridad

### ✅ **Backend (Python)**
- AWS Rekognition para análisis preciso
- Traducción automática al español
- Manejo de errores robusto
- Fácil de extender y modificar

### ✅ **Integración**
- Comunicación HTTP estándar
- Fallback a simulación si falla el backend
- Manejo asíncrono de análisis
- Logs detallados para debugging

## 🚧 Próximos Pasos

1. **Base de Datos**: Almacenar historial de análisis
2. **Autenticación**: Sistema de usuarios
3. **Múltiples Rostros**: Análisis simultáneo
4. **Exportación**: Reportes en PDF/Excel
5. **Machine Learning**: Modelos locales para mayor privacidad

## 📞 Soporte

Para problemas de integración:
1. Verificar logs de la consola del navegador
2. Verificar logs de Python en la terminal
3. Verificar configuración de AWS
4. Revisar permisos de archivos y directorios

---

**¡Sistema completamente integrado y funcional! 🎉**
