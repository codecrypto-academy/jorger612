# Product Tracker Frontend

Frontend completo en React + Vite para el sistema de trazabilidad blockchain de productos.

## 🚀 Características

### **Funcionalidades Principales**
- **Productor**: Registra productos con códigos únicos UUID
- **Almacén**: Gestiona recepción, almacenamiento y envío
- **Mayorista**: Distribuye productos a gran escala
- **Minorista**: Prepara productos para venta al consumidor
- **Consumidor**: Consulta trazabilidad completa de productos
- **Carga Masiva**: Procesa múltiples productos simultáneamente

### **Tecnologías Utilizadas**
- **React 18** - Biblioteca de interfaz de usuario
- **Vite** - Herramienta de construcción rápida
- **Tailwind CSS** - Framework CSS utilitario
- **Ethers.js** - Biblioteca para interactuar con Ethereum
- **React Hook Form** - Gestión de formularios
- **React Hot Toast** - Notificaciones
- **Lucide React** - Iconos
- **UUID** - Generación de códigos únicos

## 📋 Requisitos Previos

- **Node.js** 16+ 
- **MetaMask** o wallet compatible con Ethereum
- **Red Sepolia** configurada en tu wallet
- **ETH de prueba** para gas fees

## 🛠️ Instalación

1. **Clonar el repositorio**
```bash
cd frontend
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
# El frontend se conecta automáticamente al contrato desplegado en Sepolia
# Contrato: 0x7561eaf103403953a05ED3e6d6023f1d0366e1B2
```

4. **Ejecutar en modo desarrollo**
```bash
npm run dev
```

5. **Abrir en el navegador**
```
http://localhost:3001
```

## 🔧 Configuración

### **Contrato Blockchain**
- **Red**: Sepolia Testnet
- **Contrato**: ProductTracker
- **Dirección**: `0x7561eaf103403953a05ED3e6d6023f1d0366e1B2`
- **Explorer**: [Ver en Etherscan](https://sepolia.etherscan.io/address/0x7561eaf103403953a05ED3e6d6023f1d0366e1B2)

### **Wallet Connection**
- El frontend se conecta automáticamente a MetaMask
- Soporta cambio de cuentas y redes
- Verifica la red correcta (Sepolia)

## 📱 Uso del Sistema

### **1. Productor**
- Genera códigos UUID únicos para productos
- Registra productos individuales o en lotes
- Descarga códigos en formato CSV
- Cada producto se registra en la blockchain

### **2. Almacén**
- Registra recepción de productos del productor
- Confirma almacenamiento y envío
- Incluye coordenadas geográficas opcionales
- Control de calidad y verificación

### **3. Mayorista**
- Gestiona distribución a gran escala
- Inspección de calidad y empaquetado
- Envío a minoristas
- Actualización de inventario

### **4. Minorista**
- Recibe productos del mayorista
- Gestiona inventario de tienda
- Registra ventas a clientes
- Maneja devoluciones y productos dañados

### **5. Consumidor**
- Consulta trazabilidad completa por código
- Verifica autenticidad de eventos
- Visualiza cadena de suministro completa
- Información de ubicaciones y fechas

### **6. Carga Masiva**
- Sube archivos CSV con códigos de productos
- Procesa múltiples productos simultáneamente
- Plantilla descargable incluida
- Ideal para organizaciones grandes

## 🔐 Seguridad

### **Verificación de Firmas**
- Cada evento está firmado criptográficamente
- Verificación automática de autenticidad
- Prevención de eventos falsificados
- Trazabilidad inmutable en blockchain

### **Validación de Datos**
- Verificación de códigos UUID
- Validación de coordenadas geográficas
- Control de tipos de eventos
- Manejo de errores robusto

## 📊 Estructura del Proyecto

```
frontend/
├── src/
│   ├── components/
│   │   └── Navbar.jsx          # Navegación principal
│   ├── contexts/
│   │   └── WalletContext.jsx   # Contexto de wallet
│   ├── pages/
│   │   ├── Home.jsx            # Página de inicio
│   │   ├── Producer.jsx        # Página del productor
│   │   ├── Warehouse.jsx       # Página del almacén
│   │   ├── Wholesaler.jsx      # Página del mayorista
│   │   ├── Retailer.jsx        # Página del minorista
│   │   ├── Consumer.jsx        # Página del consumidor
│   │   └── BatchUpload.jsx     # Página de carga masiva
│   ├── App.jsx                 # Componente principal
│   ├── main.jsx                # Punto de entrada
│   └── index.css               # Estilos globales
├── public/
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## 🚀 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia servidor de desarrollo

# Producción
npm run build        # Construye para producción
npm run preview      # Vista previa de producción

# Linting
npm run lint         # Ejecuta ESLint
```

## 🌐 Despliegue

### **Despliegue Local**
```bash
npm run build
npm run preview
```

### **Despliegue en Producción**
1. Construir el proyecto: `npm run build`
2. Subir la carpeta `dist/` a tu servidor web
3. Configurar el servidor para servir archivos estáticos

## 🔍 Solución de Problemas

### **Error de Conexión de Wallet**
- Verifica que MetaMask esté instalado
- Asegúrate de estar conectado a Sepolia
- Tienes ETH suficiente para gas fees

### **Error de Transacción**
- Verifica que la red sea Sepolia
- Confirma que tienes ETH para gas
- Revisa la consola del navegador para errores

### **Problemas de Rendimiento**
- El frontend está optimizado para React 18
- Usa Vite para construcción rápida
- Tailwind CSS para estilos eficientes

## 📈 Próximas Mejoras

- [ ] Integración con IPFS para imágenes de productos
- [ ] Dashboard de analytics y estadísticas
- [ ] Notificaciones push para eventos importantes
- [ ] Modo offline con sincronización automática
- [ ] Soporte para múltiples idiomas
- [ ] PWA (Progressive Web App)

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 📞 Soporte

Para soporte técnico o preguntas:
- Revisa la documentación del contrato
- Consulta los logs de la consola del navegador
- Verifica la configuración de tu wallet

---

**Product Tracker** - Sistema de trazabilidad blockchain para la cadena de suministro
