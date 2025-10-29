# Supply Chain Tracker - Frontend

Sistema de seguimiento de cadena de suministro basado en blockchain con Next.js y ethers.js.

## Características

- Conexión con MetaMask
- Soporte para Sepolia testnet (Chain ID: 11155111)
- Soporte para nodo local de desarrollo (Chain ID: 31337)
- Interfaz moderna con Tailwind CSS
- TypeScript para seguridad de tipos
- Tests con Jest

## Requisitos Previos

- Node.js 18+
- MetaMask instalado en el navegador
- (Opcional) Nodo local de Ethereum corriendo en `http://localhost:8545`

## Instalación

```bash
cd supply-chain-tracker/web
npm install
```

## Ejecución en Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Ejecutar Tests

```bash
npm test
```

## Redes Configuradas

### Sepolia Testnet
- **Chain ID**: 11155111
- **Nombre**: Sepolia
- **Uso**: Red de prueba pública de Ethereum

### Nodo Local
- **Chain ID**: 31337
- **Nombre**: Localhost
- **RPC URL**: http://localhost:8545
- **Uso**: Red local de desarrollo (Hardhat, Ganache, etc.)

## Uso

1. **Conectar Wallet**:
   - Abre la aplicación en tu navegador
   - Haz clic en "Connect with MetaMask"
   - Acepta la conexión en MetaMask

2. **Cambiar de Red**:
   - Una vez conectado, usa el selector de red en el header
   - Selecciona entre Sepolia o Localhost
   - MetaMask te pedirá confirmar el cambio

3. **Ver Dashboard**:
   - Una vez conectado verás tu dirección, balance y red actual
   - Accede a las funciones de la cadena de suministro

## Estructura del Proyecto

```
supply-chain-tracker/web/
├── app/
│   ├── components/          # Componentes de React
│   │   ├── WelcomeScreen.tsx  # Pantalla de bienvenida
│   │   ├── Header.tsx         # Barra de navegación
│   │   └── Dashboard.tsx      # Panel principal
│   ├── hooks/              # Custom React hooks
│   │   └── useWallet.ts      # Hook para gestión de wallet
│   ├── lib/                # Utilidades y servicios
│   │   └── blockchain.ts     # Servicio de blockchain
│   ├── globals.css         # Estilos globales
│   ├── layout.tsx          # Layout principal
│   └── page.tsx            # Página principal
├── public/                 # Archivos estáticos
└── package.json           # Dependencias del proyecto
```

## Tecnologías Utilizadas

- **Next.js 15**: Framework de React
- **React 19**: Biblioteca UI
- **ethers.js 6**: Interacción con Ethereum
- **Tailwind CSS 4**: Estilos y diseño
- **TypeScript 5**: Tipado estático
- **Jest 30**: Testing

## Solución de Problemas

### MetaMask no se conecta
- Verifica que MetaMask esté instalado y desbloqueado
- Recarga la página y vuelve a intentar
- Revisa que estés usando un navegador compatible

### Red no disponible
- Para Sepolia: Asegúrate de tener ETH de prueba
- Para Localhost: Verifica que tu nodo local esté corriendo en el puerto 8545

### Error de compilación
```bash
# Elimina node_modules y reinstala
rm -rf node_modules package-lock.json
npm install
```
