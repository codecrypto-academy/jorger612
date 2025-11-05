// Juego de Asteroides - Versión Web
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Configuración del juego
const PANTALLA_X = 600;
const PANTALLA_Y = 400;
let fps = 15;
let grados = 0;
let vidas = 3;
let puntos = 0;
let ban = false; // Bandera para el misil
let cantidad = 5;

// Colores
const COLOR_BLANCO = '#ffffff';
const COLOR_NEGRO = '#000000';
const COLOR_VERDE = '#00ff00';
const COLOR_AMARILLO = '#ffff00';
const COLOR_NARANJA = '#ffa500';
const COLOR_ROJO = '#ff0000';
const COLOR_GRIS = '#808080';
const COLOR_GRIS_OSCURO = '#969696';

// Clase Nave
class Nave {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 30;
        this.misilX = PANTALLA_X + 100;
        this.misilY = y;
        this.misilWidth = 10;
        this.misilHeight = 20;
        this.respuesta = null;
    }

    draw() {
        // Dibujar nave (triángulo verde)
        ctx.fillStyle = COLOR_VERDE;
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.lineTo(this.x + this.width / 2, this.y + this.height * 0.67);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.closePath();
        ctx.fill();
    }

    drawMisil() {
        if (ban) {
            ctx.fillStyle = COLOR_AMARILLO;
            ctx.fillRect(this.misilX, this.misilY, this.misilWidth, this.misilHeight);
        }
    }

    drawExplosion() {
        ctx.fillStyle = COLOR_NARANJA;
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 25, 0, Math.PI * 2);
        ctx.fill();
    }

    update(direccion) {
        if (direccion === 'left') this.x -= 5;
        if (direccion === 'right') this.x += 5;
        if (direccion === 'up') this.y -= 5;
        if (direccion === 'down') this.y += 5;
        
        // Limitar movimiento dentro del canvas
        this.x = Math.max(0, Math.min(this.x, PANTALLA_X - this.width));
        this.y = Math.max(0, Math.min(this.y, PANTALLA_Y - this.height));
    }

    disparar() {
        this.respuesta = { x: this.x, y: this.y, width: this.width, height: this.height };
    }

    getRect() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    getMisilRect() {
        return {
            x: this.misilX,
            y: this.misilY,
            width: this.misilWidth,
            height: this.misilHeight
        };
    }
}

// Clase Asteroide
class Asteroide {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 60;
        this.grados = 0;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate((grados * Math.PI) / 180);
        ctx.translate(-this.width / 2, -this.height / 2);
        
        // Dibujar asteroide (círculo gris con textura)
        ctx.fillStyle = COLOR_GRIS_OSCURO;
        ctx.beginPath();
        ctx.arc(this.width / 2, this.height / 2, 30, 0, Math.PI * 2);
        ctx.fill();
        
        // Agregar detalles
        ctx.fillStyle = '#646464';
        ctx.beginPath();
        ctx.arc(this.width / 2 - 5, this.height / 2 - 5, 10, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(this.width / 2 + 10, this.height / 2 + 5, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    getRect() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}

// Función de colisión
function colliderect(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Crear fondo con estrellas
function createBackground() {
    const bg = document.createElement('canvas');
    bg.width = PANTALLA_X;
    bg.height = PANTALLA_Y;
    const bgCtx = bg.getContext('2d');
    bgCtx.fillStyle = COLOR_NEGRO;
    bgCtx.fillRect(0, 0, PANTALLA_X, PANTALLA_Y);
    
    // Agregar estrellas
    bgCtx.fillStyle = COLOR_BLANCO;
    for (let i = 0; i < 50; i++) {
        const x = Math.random() * PANTALLA_X;
        const y = Math.random() * PANTALLA_Y;
        bgCtx.beginPath();
        bgCtx.arc(x, y, 1, 0, Math.PI * 2);
        bgCtx.fill();
    }
    return bg;
}

// Inicializar juego
let objnave = new Nave(0, PANTALLA_Y / 2 - 25);
let arrgobj = [];
let background = createBackground();
let activePlayerAddress = null;
let gameFinished = false;
let finalScore = 0;

// Game Instance Object para integración con blockchain
const gameInstance = {
    setLives: function(count) {
        vidas = count;
        updateTargetScore();
        console.log(`Vidas establecidas: ${vidas}`);
    },
    
    addLives: function(count) {
        vidas += count;
        updateTargetScore();
        console.log(`Vidas aumentadas: ${vidas}`);
    },
    
    setActivePlayer: function(address) {
        activePlayerAddress = address;
        // NO reiniciar aquí porque el modal lo hará después de comprar vidas
        updateTargetScore();
    },
    
    getScore: function() {
        return puntos;
    },
    
    getLives: function() {
        return vidas;
    }
};

// Hacer disponible globalmente
window.gameInstance = gameInstance;

function updateTargetScore() {
    document.getElementById('targetScore').textContent = puntos;
}

function reiniciarJuego() {
    vidas = 3;
    puntos = 0;
    fps = 15;
    ban = false;
    grados = 0;
    gameFinished = false;
    objnave = new Nave(0, PANTALLA_Y / 2 - 25);
    arrgobj = [];
    for (let i = 0; i < cantidad; i++) {
        const x = PANTALLA_X - 80;
        const y = Math.random() * 300 + 1;
        arrgobj.push(new Asteroide(x, y));
    }
    objnave.misilX = PANTALLA_X + 100;
    updateTargetScore();
}

function startGame() {
    puntos = 0;
    fps = 15;
    ban = false;
    grados = 0;
    gameFinished = false;
    objnave = new Nave(0, PANTALLA_Y / 2 - 25);
    arrgobj = [];
    for (let i = 0; i < cantidad; i++) {
        const x = PANTALLA_X - 80;
        const y = Math.random() * 300 + 1;
        arrgobj.push(new Asteroide(x, y));
    }
    objnave.misilX = PANTALLA_X + 100;
    updateTargetScore();
    console.log('🎮 Juego iniciado con', vidas, 'vidas');
}

// Inicializar asteroides
for (let i = 0; i < cantidad; i++) {
    const x = PANTALLA_X - 80;
    const y = Math.random() * 300 + 1;
    arrgobj.push(new Asteroide(x, y));
}

// Controladores de teclado
const keys = {};
let rectangulo = null;

window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    
    if (vidas > 0) {
        if (e.code === 'ArrowLeft') objnave.update('left');
        if (e.code === 'ArrowRight') objnave.update('right');
        if (e.code === 'ArrowUp') objnave.update('up');
        if (e.code === 'ArrowDown') objnave.update('down');
        if (e.code === 'Space') {
            e.preventDefault();
            ban = true;
            objnave.disparar();
            if (objnave.respuesta) {
                objnave.misilX = objnave.respuesta.x + objnave.respuesta.width;
                objnave.misilY = objnave.respuesta.y + objnave.respuesta.height / 2;
            }
        }
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
    if (e.code === 'Space') {
        objnave.respuesta = null;
    }
});

// Controlador del botón
let botonHover = false;
canvas.addEventListener('mousemove', (e) => {
    if (vidas <= 0) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const botonX = PANTALLA_X / 2 - 100;
        const botonY = PANTALLA_Y / 2 + 30;
        const botonWidth = 200;
        const botonHeight = 40;
        
        botonHover = x >= botonX && x <= botonX + botonWidth &&
                     y >= botonY && y <= botonY + botonHeight;
        canvas.style.cursor = botonHover ? 'pointer' : 'default';
    }
});

canvas.addEventListener('click', (e) => {
    if (vidas <= 0) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const botonX = PANTALLA_X / 2 - 100;
        const botonY = PANTALLA_Y / 2 + 30;
        const botonWidth = 200;
        const botonHeight = 40;
        
        if (x >= botonX && x <= botonX + botonWidth &&
            y >= botonY && y <= botonY + botonHeight) {
            reiniciarJuego();
        }
    }
});

// Bucle principal del juego
function gameLoop() {
    // Limpiar canvas
    ctx.drawImage(background, 0, 0);
    
        if (vidas > 0) {
            // Mostrar marcador
            ctx.fillStyle = COLOR_BLANCO;
            ctx.font = '30px Arial';
            const texto = `Vidas: ${vidas} Puntos: ${puntos}`;
            const textWidth = ctx.measureText(texto).width;
            ctx.fillText(texto, (PANTALLA_X - textWidth) / 2, 30);
            
            // Actualizar puntaje objetivo en tiempo real
            updateTargetScore();
        
        // Actualizar y dibujar asteroides
        for (let ast of arrgobj) {
            ast.draw();
            ast.x -= 5;
            if (ast.x < 0) {
                ast.x = PANTALLA_X - 80;
                ast.y = Math.random() * 300 + 1;
            }
        }
        
        grados += 1;
        if (grados > 360) grados = 0;
        
        // Colisiones nave-asteroide
        const naveRect = objnave.getRect();
        for (let ast of arrgobj) {
            if (colliderect(naveRect, ast.getRect())) {
                ast.x = PANTALLA_X - 80;
                vidas -= 1;
            }
        }
        
        // Misil
        if (ban) {
            objnave.drawMisil();
            objnave.misilX += 10;
            
            const misilRect = objnave.getMisilRect();
            for (let i = arrgobj.length - 1; i >= 0; i--) {
                if (colliderect(misilRect, arrgobj[i].getRect())) {
                    arrgobj.splice(i, 1);
                    objnave.misilX = PANTALLA_X + 100;
                    puntos += 5;
                    fps += 1;
                    const newX = PANTALLA_X - 80;
                    const newY = Math.random() * 300 + 1;
                    arrgobj.push(new Asteroide(newX, newY));
                }
            }
        }
        
        // Dibujar nave
        objnave.draw();
    } else {
        // Pantalla Game Over
        if (!gameFinished) {
            gameFinished = true;
            finalScore = puntos;
            handleGameOver();
        }
        
        ctx.fillStyle = COLOR_BLANCO;
        ctx.font = '30px Arial';
        const textoFinal = `Game Over Puntos ${puntos}`;
        const textWidth = ctx.measureText(textoFinal).width;
        ctx.fillText(textoFinal, (PANTALLA_X - textWidth) / 2, PANTALLA_Y / 2 - 30);
        
        // Botón "Volver a jugar"
        const botonX = PANTALLA_X / 2 - 100;
        const botonY = PANTALLA_Y / 2 + 30;
        const botonWidth = 200;
        const botonHeight = 40;
        
        ctx.fillStyle = botonHover ? COLOR_VERDE : COLOR_GRIS;
        ctx.fillRect(botonX, botonY, botonWidth, botonHeight);
        ctx.strokeStyle = COLOR_BLANCO;
        ctx.lineWidth = 2;
        ctx.strokeRect(botonX, botonY, botonWidth, botonHeight);
        
        ctx.fillStyle = COLOR_BLANCO;
        ctx.font = '24px Arial';
        const botonTexto = 'Volver a jugar';
        const botonTextWidth = ctx.measureText(botonTexto).width;
        ctx.fillText(botonTexto, botonX + (botonWidth - botonTextWidth) / 2, botonY + 28);
    }
}

// Función para manejar el fin del juego
function handleGameOver() {
    if (!activePlayerAddress || !window.blockchainModule) return;
    
    // Calcular ganador de apuestas
    const winner = window.blockchainModule.calculateBettingWinner(finalScore);
    
    if (winner) {
        // Mostrar resultados de apuestas
        showBettingResults(winner);
    }
}

// Función para mostrar resultados de apuestas
function showBettingResults(winner) {
    const resultsDiv = document.getElementById('bettingResults');
    const resultsContent = document.getElementById('resultsContent');
    
    resultsDiv.style.display = 'block';
    
    const accountInfo = Object.values(window.blockchainModule.ACCOUNTS)
        .find(acc => acc.address === winner.address);
    
    let html = `
        <div class="result-item winner">
            <strong>🏆 Ganador: ${accountInfo ? accountInfo.role : 'Desconocido'}</strong><br>
            Puntaje Objetivo (obtenido): ${finalScore}<br>
            Puntaje Propuesto: ${winner.proposedScore || 'N/A'}<br>
            Diferencia: ${winner.difference}<br>
            Premio: ${winner.totalPot} tokens
        </div>
    `;
    
    resultsContent.innerHTML = html;
    
    // Habilitar botón de distribución
    const distributeBtn = document.getElementById('distributeBtn');
    if (distributeBtn) {
        distributeBtn.disabled = false;
    }
    
    // Actualizar el botón Pagar Apuesta después de calcular el ganador
    if (window.blockchainModule && typeof window.blockchainModule.updatePagarApuestaButton === 'function') {
        window.blockchainModule.updatePagarApuestaButton();
    }
}

// Control de FPS mejorado
let lastTime = 0;
const targetFPS = 15;
const frameInterval = 1000 / targetFPS;

function gameLoopWithFPS(currentTime) {
    if (currentTime - lastTime >= frameInterval) {
        gameLoop();
        lastTime = currentTime - ((currentTime - lastTime) % frameInterval);
    }
    requestAnimationFrame(gameLoopWithFPS);
}

// Iniciar juego
requestAnimationFrame(gameLoopWithFPS);

