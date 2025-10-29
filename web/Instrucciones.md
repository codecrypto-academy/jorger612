# Supply Chain Tracker - Instrucciones de Instalación y Uso

## 📋 Descripción del Proyecto

Supply Chain Tracker es una aplicación web descentralizada que permite rastrear productos a través de una cadena de suministro utilizando blockchain. La aplicación utiliza contratos inteligentes para gestionar tokens que representan productos y sus transferencias entre diferentes roles en la cadena de suministro.

## 🏗️ Arquitectura del Sistema

### Roles del Sistema
- **Admin**: Administrador del sistema que puede gestionar usuarios y aprobar registros
- **Producer**: Productor que crea tokens de productos
- **Factory**: Fábrica que procesa productos
- **Retailer**: Minorista que vende productos a consumidores
- **Consumer**: Consumidor final que compra productos

### Flujo de la Cadena de Suministro
```
Producer → Factory → Retailer → Consumer
```

## 🚀 Instalación

### Prerrequisitos

1. **Node.js** (versión 18 o superior)
2. **npm** o **yarn**
3. **MetaMask** (extensión del navegador)
4. **Anvil** (cliente de desarrollo de Ethereum)

### Pasos de Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd supply-chain-tracker/web
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar Anvil**
   ```bash
   # Instalar Foundry (si no está instalado)
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   
   # Iniciar Anvil en una terminal separada
   anvil
   ```
   
   Anvil debería mostrar:
   ```
   Listening on http://0.0.0.0:8545
   ```

4. **Configurar MetaMask**
   - Abrir MetaMask
   - Agregar red personalizada:
     - **Nombre de red**: Anvil Local
     - **URL RPC**: http://localhost:8545
     - **ID de cadena**: 31337
     - **Símbolo de moneda**: ETH

5. **Importar cuentas de Anvil en MetaMask**
   - Copiar las claves privadas de las cuentas generadas por Anvil
   - Importar cada cuenta en MetaMask usando "Importar cuenta"

### Cuentas Predefinidas

El sistema utiliza las siguientes cuentas predefinidas:

| Rol | Dirección | Clave Privada |
|-----|-----------|---------------|
| Admin | 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 | 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 |
| Producer | 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 | 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d |
| Factory | 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC | 0x5de4111daa5ba1e184de05ad535c61165a74d15e3a6d3467fdefe15aa073575 |
| Retailer | 0x90F79bf6EB2c4f870365E785982E1f101E93b906 | 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6 |
| Consumer | 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65 | 0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926 |

## 🎮 Uso del Sistema

### 1. Iniciar la Aplicación

```bash
npm run dev
```

La aplicación estará disponible en: http://localhost:3000

### 2. Conectar Wallet

1. Abrir la aplicación en el navegador
2. Hacer clic en "Connect with MetaMask"
3. Seleccionar una cuenta en MetaMask
4. La aplicación automáticamente cambiará a la red Anvil

### 3. Registro de Usuarios

#### Para Admin
- El Admin se registra automáticamente al conectarse
- No requiere registro manual

#### Para otros roles (Producer, Factory, Retailer, Consumer)
1. Conectar con la cuenta correspondiente
2. Seleccionar el rol deseado
3. Hacer clic en "Request Registration"
4. Esperar aprobación del Admin

### 4. Funcionalidades por Rol

#### Admin
- **Panel de Administración**: Gestionar usuarios y aprobar registros
- **Dashboard**: Ver todos los tokens del sistema
- **My Tokens**: Ver tokens de todas las cuentas organizados por rol
- **Seguimiento**: Rastrear cualquier token en el sistema

#### Producer
- **Crear Tokens**: Crear nuevos productos/tokens
- **My Tokens**: Ver tokens creados
- **Transferir**: Enviar tokens a Factory
- **Seguimiento**: Rastrear tokens creados

#### Factory
- **Recibir Tokens**: Aceptar transferencias de Producer
- **Procesar**: Modificar características de productos
- **Transferir**: Enviar tokens procesados a Retailer
- **Seguimiento**: Rastrear tokens procesados

#### Retailer
- **Recibir Tokens**: Aceptar transferencias de Factory
- **Store**: Ver productos disponibles para venta
- **Vender**: Transferir productos a Consumer
- **Seguimiento**: Rastrear productos en inventario

#### Consumer
- **Store**: Ver productos disponibles
- **Comprar**: Adquirir productos del Retailer
- **My Purchases**: Ver historial de compras
- **Seguimiento**: Rastrear productos comprados

### 5. Flujo de Trabajo Típico

1. **Producer** crea un token de producto
2. **Producer** transfiere el token a **Factory**
3. **Factory** acepta la transferencia y procesa el producto
4. **Factory** transfiere el token procesado a **Retailer**
5. **Retailer** acepta la transferencia y pone el producto en venta
6. **Consumer** compra el producto del **Retailer**
7. **Consumer** puede rastrear el producto desde su origen

## 🔧 Configuración Avanzada

### Variables de Entorno

Crear un archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_RPC_URL=http://localhost:8545
NEXT_PUBLIC_CHAIN_ID=31337
```

### Redes Soportadas

- **Anvil (Localhost)**: Red de desarrollo local (Chain ID: 31337)
- **Sepolia Testnet**: Red de prueba pública (Chain ID: 11155111) - *En construcción*

## 🐛 Solución de Problemas

### Error: "MetaMask no está instalado"
- Instalar la extensión MetaMask en el navegador
- Refrescar la página después de la instalación

### Error: "Wrong network detected"
- Asegurarse de que Anvil esté ejecutándose
- Verificar que MetaMask esté conectado a la red Anvil
- La aplicación cambiará automáticamente a Anvil

### Error: "Contract not initialized"
- Verificar que Anvil esté ejecutándose en el puerto 8545
- Verificar que el contrato esté desplegado correctamente
- Refrescar la página

### Error: "User not found"
- Asegurarse de que el usuario esté registrado en el sistema
- Verificar que el Admin haya aprobado el registro

### Error: "Insufficient balance"
- Verificar que la cuenta tenga suficiente ETH para gas
- Anvil proporciona 10,000 ETH por defecto a cada cuenta

## 📚 Comandos Útiles

### Desarrollo
```bash
# Iniciar servidor de desarrollo
npm run dev

# Construir para producción
npm run build

# Iniciar servidor de producción
npm start

# Ejecutar linter
npm run lint
```

### Anvil
```bash
# Iniciar Anvil con configuración personalizada
anvil --host 0.0.0.0 --port 8545

# Iniciar Anvil con cuentas específicas
anvil --accounts 10 --balance 10000
```

## 🔒 Seguridad

### Consideraciones de Seguridad
- **Nunca** compartir claves privadas
- **Solo** usar en entorno de desarrollo
- **No** usar cuentas de producción en Anvil
- **Verificar** siempre las transacciones antes de confirmar

### Mejores Prácticas
- Usar cuentas separadas para cada rol
- Mantener Anvil ejecutándose durante el desarrollo
- Verificar el estado del contrato regularmente
- Hacer backup de configuraciones importantes

## 📞 Soporte

### Recursos Adicionales
- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de ethers.js](https://docs.ethers.io/)
- [Documentación de Foundry](https://book.getfoundry.sh/)
- [Documentación de MetaMask](https://docs.metamask.io/)

### Contacto
Para soporte técnico o reportar bugs, contactar al equipo de desarrollo.

---

**Versión**: 1.0.0  
**Última actualización**: Diciembre 2024
