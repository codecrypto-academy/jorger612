# ScanEoFacial - Next.js

Sistema de reconocimiento facial con análisis de emociones en tiempo real, construido con Next.js 14, TypeScript y Tailwind CSS.

## 🚀 Características

- **Detección Facial en Tiempo Real**: Análisis continuo de rostros usando la cámara web
- **Análisis de Emociones**: Detección de 7 emociones principales (TRANQUILO, FELIZ, ENOJADO, MIEDO, TRISTE, SORPRENDIDO, DISGUSTADO)
- **Estimación de Edad y Género**: Análisis demográfico con alta precisión
- **Interfaz Moderna**: Diseño glassmorphism con Tailwind CSS
- **Responsive Design**: Optimizado para dispositivos móviles y desktop
- **TypeScript**: Código completamente tipado para mayor robustez

## 🛠️ Tecnologías

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Detección Facial**: WebRTC + Canvas API
- **Estado**: React Hooks (useState, useEffect, useRef)
- **Build Tool**: Next.js App Router

## 📁 Estructura del Proyecto

```
scaneonextjs/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Layout principal
│   │   ├── page.tsx            # Página principal
│   │   └── globals.css         # Estilos globales
│   └── components/
│       ├── VideoFeed.tsx       # Componente de video y cámara
│       ├── EmotionDisplay.tsx  # Visualización de emociones
│       └── AnalysisPanel.tsx   # Panel de análisis
├── public/                     # Archivos estáticos
├── package.json               # Dependencias del proyecto
├── tailwind.config.js         # Configuración de Tailwind
├── tsconfig.json              # Configuración de TypeScript
└── README.md                  # Este archivo
```

## 🚀 Instalación

### Prerrequisitos

- Node.js 18+ 
- npm o yarn

### Pasos de Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd scaneonextjs
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   # o
   yarn install
   ```

3. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   # o
   yarn dev
   ```

4. **Abrir en el navegador**
   ```
   http://localhost:3000
   ```

## 🔧 Scripts Disponibles

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Construir para producción
- `npm run start` - Servidor de producción
- `npm run lint` - Ejecutar ESLint

## 📱 Uso de la Aplicación

### 1. Activar Cámara
- Haz clic en "Activar Cámara"
- Permite acceso a la cámara cuando el navegador lo solicite
- La cámara se inicializará y mostrará el feed de video

### 2. Detección Facial
- Posiciona tu rostro en el centro de la cámara
- El sistema detectará automáticamente tu rostro
- Aparecerá un marco verde cuando se detecte correctamente

### 3. Análisis de Emociones
- Una vez detectado el rostro, haz clic en "Iniciar Análisis (30s)"
- El análisis durará 30 segundos
- Se mostrará una barra de progreso y contador regresivo

### 4. Resultados
- Las emociones detectadas se mostrarán en tiempo real
- Se actualizará el historial de emociones
- Se mostrarán datos demográficos (edad, género, confianza)

## 🎨 Personalización

### Colores de Emociones
Puedes personalizar los colores de las emociones en `EmotionDisplay.tsx`:

```typescript
const getEmotionColor = (emotionType: string) => {
  switch (emotionType) {
    case 'TRANQUILO':
      return 'from-blue-500 to-blue-600'
    case 'FELIZ':
      return 'from-green-500 to-green-600'
    // ... más emociones
  }
}
```

### Estilos de Tailwind
Modifica `tailwind.config.js` para personalizar el tema:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#667eea',
        secondary: '#764ba2',
      }
    }
  }
}
```

## 🔒 Permisos Requeridos

- **Cámara**: Para captura de video en tiempo real
- **Microphone**: Opcional, para futuras funcionalidades de audio

## 🌐 Compatibilidad de Navegadores

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 11+
- ✅ Edge 79+

## 🚧 Funcionalidades Futuras

- [ ] Integración con backend Python (AWS Rekognition)
- [ ] Almacenamiento de historial en base de datos
- [ ] Exportación de reportes en PDF
- [ ] Análisis de múltiples rostros simultáneos
- [ ] Modo oscuro/claro
- [ ] PWA (Progressive Web App)

## 🐛 Solución de Problemas

### La cámara no se activa
- Verifica que el navegador tenga permisos para acceder a la cámara
- Asegúrate de estar usando HTTPS en producción
- Intenta recargar la página

### Detección facial no funciona
- Mejora la iluminación del entorno
- Acércate más a la cámara
- Mantén el rostro centrado
- Usa los botones de simulación para pruebas

### Errores de TypeScript
- Ejecuta `npm run build` para ver errores de compilación
- Verifica que todas las dependencias estén instaladas
- Asegúrate de que los tipos estén correctamente definidos

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Soporte

Si tienes problemas o preguntas:

- Abre un issue en GitHub
- Contacta al equipo de desarrollo
- Consulta la documentación de Next.js

## 🙏 Agradecimientos

- Next.js Team por el framework
- Tailwind CSS por el sistema de diseño
- React Team por la biblioteca de UI
- Comunidad open source por las contribuciones

---

**Desarrollado con ❤️ usando Next.js 14**
