# 🏢 Gestión de Empresas en Blockchain

Una aplicación React que permite gestionar empresas utilizando la blockchain de Ethereum como medio de almacenamiento.

## ✨ Características

- **Conectividad Blockchain**: Integración completa con Ethereum usando ethers.js
- **Gestión de Empresas**: Agregar nuevas empresas a la blockchain
- **Listado en Tiempo Real**: Consultar todas las empresas registradas
- **Interfaz Moderna**: UI/UX elegante y responsiva
- **Integración MetaMask**: Conexión segura con wallets de Ethereum

## 🚀 Instalación

### Prerrequisitos

- Node.js (versión 16 o superior)
- MetaMask instalado en tu navegador
- Una wallet de Ethereum con ETH para gas fees

### Pasos de Instalación

1. **Clonar o descargar el proyecto**
   ```bash
   cd empresa
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Iniciar la aplicación**
   ```bash
   npm start
   ```

4. **Abrir en el navegador**
   La aplicación se abrirá automáticamente en `http://localhost:3000`

## 🔧 Configuración

### Contrato Inteligente

La aplicación está configurada para usar el contrato inteligente en la dirección:
```
0x73Ae10E84468c30e564A02d6e18068D10854A333
```

### ABI

El archivo `ABI_EMPRESA` contiene la interfaz del contrato inteligente con los métodos:
- `agregarEmpresa(string _nombre)`: Agrega una nueva empresa
- `consultarTodasLasEmpresas()`: Retorna todas las empresas registradas

## 📱 Uso de la Aplicación

### 1. Conectar Wallet

- Haz clic en "🔗 Conectar MetaMask"
- Acepta la conexión en MetaMask
- Verifica que estés en la red correcta

### 2. Agregar Empresa

- Completa el campo "Nombre de la Empresa"
- Haz clic en "Agregar Empresa"
- Confirma la transacción en MetaMask
- Espera la confirmación en la blockchain

### 3. Ver Empresas

- Las empresas se cargan automáticamente
- Usa "🔄 Actualizar Lista" para refrescar
- Cada empresa muestra su nombre y dirección en la blockchain

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React 18
- **Blockchain**: Ethereum + ethers.js
- **Estilos**: CSS3 con diseño responsivo
- **Wallet**: MetaMask integration

## 📁 Estructura del Proyecto

```
empresa/
├── public/
│   └── index.html
├── src/
│   ├── App.js          # Componente principal
│   ├── index.js        # Punto de entrada
│   └── index.css       # Estilos globales
├── ABI_EMPRESA         # Interfaz del contrato
├── package.json        # Dependencias
└── README.md          # Este archivo
```

## 🔒 Seguridad

- Todas las transacciones requieren confirmación del usuario
- La aplicación no almacena claves privadas
- Conexión segura a través de MetaMask
- Validación de entrada en el frontend

## 🚨 Solución de Problemas

### Error de Conexión
- Verifica que MetaMask esté instalado
- Asegúrate de estar en la red correcta
- Revisa que la cuenta esté desbloqueada

### Transacciones Fallidas
- Verifica que tengas ETH suficiente para gas
- Revisa que la red no esté congestionada
- Confirma que el contrato esté desplegado

### Problemas de Rendimiento
- Usa redes de prueba para desarrollo
- Verifica la conectividad a la blockchain
- Considera usar nodos RPC más rápidos

## 🌐 Redes Soportadas

La aplicación funciona en cualquier red compatible con Ethereum:
- Ethereum Mainnet
- Redes de prueba (Goerli, Sepolia)
- Redes privadas
- Redes de desarrollo local

## 📞 Soporte

Si encuentras problemas:
1. Verifica la consola del navegador para errores
2. Asegúrate de que todas las dependencias estén instaladas
3. Verifica que el contrato esté desplegado en la red correcta
4. Revisa que MetaMask esté configurado correctamente

## 🔄 Actualizaciones

Para mantener la aplicación actualizada:
```bash
npm update
npm audit fix
```

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

---

**¡Disfruta gestionando empresas en la blockchain! 🚀**
