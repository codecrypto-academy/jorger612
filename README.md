# Juego de Asteroides - Blockchain Game

Este proyecto integra el juego de asteroides desarrollado en Pygame en una aplicación web usando Flask, con funcionalidad completa de blockchain mediante MetaMask y ethers.js.

## Características

- 🎮 Juego completo de asteroides en el navegador
- 🚀 Controles con teclado (flechas y espacio)
- 💫 Sistema de vidas y puntos
- 🔄 Botón para reiniciar el juego
- ⛓️ Integración con blockchain (MetaMask + ethers.js)
- 💰 Sistema de tokens y banco central
- 🎲 Sistema de apuestas entre jugadores
- 🏦 Compra de vidas con tokens
- 🏆 Distribución automática de ganancias

## Requisitos

- Python 3.7 o superior
- Flask
- MetaMask instalado en el navegador
- ethers.js (incluido via CDN)

## Instalación

1. Instala las dependencias:
```bash
pip install -r requirements.txt
```

## Ejecución

1. Inicia el servidor Flask:
```bash
python app.py
```

2. Abre tu navegador y ve a:
```
http://localhost:5000
```

3. Conecta tu wallet MetaMask haciendo clic en "Conectar con MetaMask"

## Controles del Juego

- **Flechas ←→↑↓**: Mover la nave
- **Espacio**: Disparar misiles
- **Clic en "Volver a jugar"**: Reiniciar el juego cuando aparece Game Over

## Sistema Blockchain

### Cuentas del Sistema

El juego utiliza 5 cuentas predefinidas:

| Rol | Dirección | Nombre en MetaMask |
|-----|-----------|-------------------|
| Admin | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | Account 6 |
| Jugador 1 | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | Account 7 |
| Jugador 2 | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | Account 8 |
| Jugador 3 | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` | Account 9 |
| Jugador 4 | `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65` | Account 10 |

### Funcionalidades Blockchain

1. **Banco Central**: 
   - Genera y vende tokens
   - Rastrea tokens totales y vendidos
   - Gestiona el balance de cada cuenta

2. **Sistema de Vidas**:
   - Cada vida cuesta 10 tokens
   - Los tokens se deducen del jugador activo
   - Los tokens comprados vuelven al banco

3. **Sistema de Apuestas**:
   - Los jugadores pueden apostar tokens sobre el puntaje del jugador activo
   - El apostador que más se acerque al puntaje objetivo gana
   - El ganador recibe todos los tokens apostados

### Integración con Smart Contract

El código está preparado para recibir el ABI y dirección del smart contract. Ver `SMART_CONTRACT_INTEGRATION.md` para más detalles.

## Estructura del Proyecto

```
asteroide/
├── app.py                 # Aplicación Flask principal
├── templates/
│   └── index.html        # Página HTML del juego
├── static/
│   ├── game.js           # Lógica del juego en JavaScript
│   ├── blockchain.js     # Integración con blockchain (ethers.js)
│   └── style.css         # Estilos CSS
├── requirements.txt       # Dependencias de Python
├── README.md             # Este archivo
└── SMART_CONTRACT_INTEGRATION.md  # Guía de integración
```

## Notas

- El juego original de Pygame (`juego2.py`) sigue disponible para ejecución en escritorio
- Esta versión web replica toda la funcionalidad del juego original
- Los gráficos son generados dinámicamente usando HTML5 Canvas
- La integración blockchain funciona actualmente en modo simulación
- Se requiere el smart contract y ABI para funcionalidad completa

## Próximos Pasos

1. Implementar el smart contract para gestión de tokens
2. Conectar funciones de blockchain con el contrato
3. Agregar eventos del contrato para actualizaciones en tiempo real
4. Implementar predicción de puntaje en el sistema de apuestas
