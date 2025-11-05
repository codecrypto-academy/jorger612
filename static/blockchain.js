// Blockchain Integration con ethers.js
// Estructura preparada para recibir el ABI del smart contract

// Configuración inicial
let provider = null;
let signer = null;
let contract = null;
const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // Dirección del contrato desplegado
let contractABI = null;
let localProvider = null; // Provider para nodo local
let useLocalNode = false; // Flag para usar nodo local
const LOCAL_NODE_URL = 'http://localhost:8545'; // URL del nodo local
const ADMIN_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'; // Dirección del Admin
let tokenDecimals = null; // Número de decimales del token (se obtiene del contrato). null = no consultado aún

// Definición de cuentas del sistema
const ACCOUNTS = {
    Admin: {
        address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        name: "Account 6",
        role: "Admin"
    },
    "Jugador 1": {
        address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        name: "Account 7",
        role: "Jugador 1"
    },
    "Jugador 2": {
        address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
        name: "Account 8",
        role: "Jugador 2"
    },
    "Jugador 3": {
        address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
        name: "Account 9",
        role: "Jugador 3"
    },
    "Jugador 4": {
        address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
        name: "Account 10",
        role: "Jugador 4"
    }
};

// Estado global
let connectedAccount = null;
let activePlayerAccount = null;
let accountBalances = {};
let totalTokens = 0;
let soldTokens = 0;
let boughtTokens = 0; // Tokens comprados del banco (salieron del banco)
let currentBets = {}; // Almacena las apuestas actuales {address: betAmount}
let proposedScores = {}; // Almacena los puntajes propuestos {address: proposedScore}
let initialBankBalance = 0; // Balance inicial del banco para calcular tokens comprados
const PRICE_PER_LIFE = 1; // Precio de cada vida en tokens
let stakedPotAmount = 0; // Suma total de tokens apostados por todos los jugadores
let currentWinner = null; // Almacena el ganador actual {address, role, difference, betAmount, proposedScore, totalPot}

// Este archivo se carga solo después de que ethers.js esté disponible
// Verificar que ethers esté disponible al inicio del script
if (typeof ethers === 'undefined') {
    throw new Error('❌ ethers.js no está disponible. Este script debe cargarse después de ethers.js');
}

console.log('📦 blockchain.js cargado. ethers disponible:', typeof ethers !== 'undefined', 'versión:', ethers.version || 'N/A');

// Función de inicialización que se puede llamar en cualquier momento
async function initializeBlockchain() {
    // Verificar nuevamente que ethers esté disponible
    if (typeof ethers === 'undefined') {
        console.error('❌ ethers.js no está disponible');
        alert('Error crítico: ethers.js no está disponible. Por favor recarga la página.');
        return;
    }
    
    console.log('🚀 Inicializando blockchain...');
    await loadABI();
    await initBlockchain();
    setupUI();
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeBlockchain);
} else {
    // Si el DOM ya está cargado, inicializar inmediatamente
    initializeBlockchain();
}

// Función para cargar el ABI desde el archivo JSON
async function loadABI() {
    try {
        const response = await fetch('/static/ABI.json');
        if (!response.ok) {
            throw new Error('No se pudo cargar el ABI');
        }
        contractABI = await response.json();
        console.log('✅ ABI cargado exitosamente:', contractABI.length, 'funciones');
        
        // Configurar el contrato automáticamente
        if (contractABI && CONTRACT_ADDRESS) {
            await setContractInfo(contractABI, CONTRACT_ADDRESS);
        }
    } catch (error) {
        console.error('❌ Error al cargar ABI:', error);
        alert('Error al cargar el ABI del contrato. Verifique que ABI.json esté en la carpeta static/');
    }
}

// Función para inicializar conexión con blockchain
async function initBlockchain() {
    console.log('🔌 Inicializando conexión blockchain...');
    
    try {
        // Test de conexión al nodo local (Anvil)
        await testLocalNodeConnection();
        
        // Verificar si MetaMask está instalado
        if (typeof window.ethereum !== 'undefined') {
            console.log('✅ MetaMask está instalado');
            // Escuchar cambios de cuenta
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', handleChainChanged);
        } else {
            console.log('⚠️ MetaMask no está instalado');
        }
    } catch (error) {
        console.error('❌ Error al inicializar blockchain:', error);
    }
}

// Función para testear conexión al nodo local
async function testLocalNodeConnection() {
    // Verificar que ethers esté disponible
    if (typeof ethers === 'undefined') {
        console.warn('⚠️ ethers no disponible para test de Anvil');
        return false;
    }
    
    try {
        console.log('🔍 Testeando conexión a Anvil en', LOCAL_NODE_URL);
        localProvider = new ethers.providers.JsonRpcProvider(LOCAL_NODE_URL);
        
        // Test con timeout
        const network = await Promise.race([
            localProvider.getNetwork(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
        ]);
        
        const blockNumber = await Promise.race([
            localProvider.getBlockNumber(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
        ]);
        
        console.log('✅ Anvil conectado:', {
            network: network.name,
            chainId: network.chainId.toString(),
            blockNumber: blockNumber,
            esperadoChainId: '31337'
        });
        
        // Validar chain ID
        if (network.chainId.toString() === '31337') {
            console.log('✅ Chain ID correcto (31337)');
        } else {
            console.warn('⚠️ Chain ID diferente al esperado:', network.chainId.toString());
        }
        
        // Test del contrato si está cargado
        if (contractABI && CONTRACT_ADDRESS) {
            await testContractConnection();
        }
        
        return true;
    } catch (localError) {
        console.warn('⚠️ Anvil no disponible:', localError.message);
        return false;
    }
}

// Función para testear conexión al contrato
async function testContractConnection() {
    // Verificar que ethers esté disponible
    if (typeof ethers === 'undefined') {
        console.warn('⚠️ ethers no disponible para test de contrato');
        return false;
    }
    
    try {
        if (!contractABI || !CONTRACT_ADDRESS) {
            console.warn('⚠️ Contrato no configurado aún');
            return false;
        }
        
        console.log('🔍 Testeando conexión al contrato:', CONTRACT_ADDRESS);
        
        const testProvider = localProvider || provider;
        if (!testProvider) {
            console.warn('⚠️ No hay provider disponible para test');
            return false;
        }
        
        const testContract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, testProvider);
        
        // Intentar leer una función view (sin costo de gas)
        try {
            // Primero verificar que el código del contrato existe en esta dirección
            const code = await testProvider.getCode(CONTRACT_ADDRESS);
            if (code === '0x' || code === '0x0' || !code) {
                console.error('❌ No hay código de contrato en la dirección:', CONTRACT_ADDRESS);
                console.error('   Verifique que el contrato esté desplegado en esta dirección');
                return false;
            }
            
            const decimals = await testContract.decimals();
            console.log('✅ Decimales del token:', decimals);
            tokenDecimals = decimals;
            
            const totalSupply = await testContract.totalSupply();
            const supplyNum = parseFloat(totalSupply.toString());
            console.log('✅ Contrato conectado - Total Supply:', supplyNum, '(raw:', totalSupply.toString(), ')');
            
            const symbol = await testContract.symbol();
            console.log('✅ Símbolo del token:', symbol);
            
            // Verificar que el contrato esté en la red correcta
            const network = await testProvider.getNetwork();
            console.log('📡 Red actual - Chain ID:', network.chainId.toString());
            if (network.chainId.toString() === '31337') {
                console.log('✅ Contrato en red Anvil (Chain ID: 31337)');
            } else {
                console.warn('⚠️ Chain ID:', network.chainId.toString(), '- Verifique que sea la red correcta');
            }
            
            return true;
        } catch (error) {
            console.error('❌ Error al leer del contrato:', error);
            console.error('   Detalles:', {
                message: error.message,
                code: error.code,
                reason: error.reason,
                data: error.data
            });
            console.error('   Verifique que:');
            console.error('   1. El contrato esté desplegado en:', CONTRACT_ADDRESS);
            console.error('   2. Esté en la red correcta (Chain ID esperado: 31337 para Anvil)');
            console.error('   3. El ABI sea correcto');
            return false;
        }
    } catch (error) {
        console.error('❌ Error en test de contrato:', error);
        return false;
    }
}

// Función para conectar con MetaMask o nodo local
async function connectWallet() {
    console.log('🖱️ Función connectWallet llamada');
    
    // Verificar que ethers esté disponible
    if (typeof ethers === 'undefined') {
        console.error('❌ ethers no está definido');
        alert('Error: ethers.js no se cargó correctamente. Por favor recarga la página.');
        return;
    }
    
    console.log('🔌 Iniciando conexión de wallet...');
    console.log('📦 ethers disponible:', typeof ethers !== 'undefined', 'versión:', ethers.version || 'N/A');
    
    // Deshabilitar el botón mientras se procesa
    const connectBtn = document.getElementById('connectWalletBtn');
    if (connectBtn) {
        connectBtn.disabled = true;
        const statusEl = document.getElementById('walletStatus');
        if (statusEl) statusEl.textContent = 'Conectando...';
    }
    
    try {
        // Opción 1: Conectar con MetaMask si está disponible (PRIORIDAD)
        if (typeof window.ethereum !== 'undefined') {
            try {
                console.log('📱 Intentando conectar con MetaMask...');
                const accounts = await window.ethereum.request({ 
                    method: 'eth_requestAccounts' 
                });
                
                if (accounts.length > 0) {
                    connectedAccount = accounts[0];
                    provider = new ethers.providers.Web3Provider(window.ethereum);
                    signer = provider.getSigner();
                    useLocalNode = false;
                    
                    console.log('✅ MetaMask conectado:', connectedAccount);
                    
                    // Test de conexión del contrato
                    if (contractABI && CONTRACT_ADDRESS) {
                        await loadContract();
                        await testContractConnection();
                    }
                    
                    await loadAccountBalances();
                    await updateBankUI(); // Actualizar estadísticas del banco
                    updateWalletStatus(true);
                    
                    console.log('✅ Conexión completada con MetaMask');
                    
                    // Rehabilitar el botón
                    if (connectBtn) connectBtn.disabled = false;
                    return;
                }
            } catch (metaMaskError) {
                console.warn('⚠️ Error al conectar con MetaMask:', metaMaskError);
                // Continuar para intentar nodo local
            }
        } else {
            console.log('📱 MetaMask no está instalado, intentando Anvil...');
        }
        
        // Opción 2: Usar nodo local (Anvil) como alternativa
        try {
            console.log('🖥️ Intentando conectar con Anvil en', LOCAL_NODE_URL);
            
            if (!localProvider) {
                localProvider = new ethers.providers.JsonRpcProvider(LOCAL_NODE_URL);
            }
            
            const network = await Promise.race([
                localProvider.getNetwork(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
            ]);
            
            const blockNumber = await Promise.race([
                localProvider.getBlockNumber(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
            ]);
            
            console.log('✅ Anvil conectado:', {
                network: network.name,
                chainId: network.chainId.toString(),
                blockNumber: blockNumber
            });
            
            // Verificar que el chainId sea 31337 (Anvil por defecto)
            if (network.chainId.toString() !== '31337') {
                console.warn('⚠️ Chain ID esperado 31337, pero recibido:', network.chainId.toString());
            }
            
            provider = localProvider;
            useLocalNode = true;
            
            // Obtener cuentas de Anvil
            const accounts = await Promise.race([
                localProvider.listAccounts(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
            ]);
            
            console.log('📋 Cuentas disponibles en Anvil:', accounts.length);
            
            if (accounts.length > 0) {
                connectedAccount = accounts[0];
                signer = localProvider.getSigner(connectedAccount);
                
                console.log('✅ Usando cuenta de Anvil:', connectedAccount);
                
                // Test de conexión del contrato
                if (contractABI && CONTRACT_ADDRESS) {
                    await loadContract();
                    await testContractConnection();
                }
                
                await loadAccountBalances();
                await updateBankUI(); // Actualizar estadísticas del banco
                updateWalletStatus(true, true);
                
                console.log('✅ Conexión completada con Anvil');
                
                // Rehabilitar el botón
                if (connectBtn) connectBtn.disabled = false;
                return;
            } else {
                console.warn('⚠️ Anvil conectado pero no hay cuentas disponibles');
                alert('Anvil conectado pero no hay cuentas disponibles.\nAsegúrate de que Anvil esté ejecutándose correctamente.');
                
                // Rehabilitar el botón
                if (connectBtn) connectBtn.disabled = false;
                if (connectBtn) {
                    const statusEl = document.getElementById('walletStatus');
                    if (statusEl) statusEl.textContent = 'Conectar con MetaMask';
                }
                return;
            }
        } catch (localError) {
            console.error('❌ Error al conectar con Anvil:', localError);
            
            if (typeof window.ethereum === 'undefined') {
                alert('❌ No se pudo conectar a Anvil ni a MetaMask.\n\nSoluciones:\n1. Asegúrate de que Anvil esté ejecutándose: anvil\n2. Verifica que esté en http://localhost:8545\n3. O instala MetaMask desde metamask.io');
            } else {
                alert('❌ No se pudo conectar con MetaMask ni con Anvil.\n\nVerifica:\n1. MetaMask está desbloqueado\n2. Anvil está ejecutándose en http://localhost:8545\n3. Chain ID debe ser 31337');
            }
        }
        
    } catch (error) {
        console.error('❌ Error general al conectar wallet:', error);
        alert('Error al conectar: ' + error.message);
    } finally {
        // Asegurarse de rehabilitar el botón en cualquier caso
        const connectBtn = document.getElementById('connectWalletBtn');
        if (connectBtn && !connectedAccount) {
            connectBtn.disabled = false;
            const statusEl = document.getElementById('walletStatus');
            if (statusEl && !connectedAccount) {
                statusEl.textContent = 'Conectar con MetaMask';
            }
        }
    }
}

// Función para cargar el contrato
async function loadContract() {
    // Verificar que ethers esté disponible
    if (typeof ethers === 'undefined') {
        console.error('❌ ethers no está definido');
        return;
    }
    
    if (!contractABI || !CONTRACT_ADDRESS) {
        console.warn('⚠️ Esperando ABI y dirección del contrato...');
        return;
    }
    
    try {
        // Priorizar signer si está disponible (para transacciones)
        // Si no hay signer, usar provider para solo lectura
        const contractInterface = signer || provider || localProvider;
        if (!contractInterface) {
            console.warn('⚠️ No hay provider disponible para cargar el contrato');
            return;
        }
        
        contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, contractInterface);
        
        console.log('✅ Contrato cargado:', {
            address: CONTRACT_ADDRESS,
            usingLocalNode: useLocalNode,
            hasSigner: !!signer
        });
        
        // OBTENER DECIMALES INMEDIATAMENTE después de cargar el contrato
        try {
            tokenDecimals = await contract.decimals();
            console.log(`📊 Decimales del token obtenidos al cargar contrato: ${tokenDecimals}`);
        } catch (error) {
            console.warn('⚠️ No se pudieron obtener decimales del contrato, usando 0:', error);
            tokenDecimals = 0;
        }
        
        // Listener para eventos Transfer
        contract.on("Transfer", async (from, to, value) => {
            const valueNum = parseFloat(value.toString());
            console.log('🔄 Transfer event:', {
                from,
                to,
                value: valueNum,
                rawValue: value.toString()
            });
            // Actualizar balances cuando hay transferencias
            loadAccountBalances();
        });
    } catch (error) {
        console.error('❌ Error al cargar contrato:', error);
    }
}

// Función para establecer el ABI y dirección del contrato
async function setContractInfo(abi, address) {
    contractABI = abi;
    // Cargar contrato incluso si no hay signer (modo lectura)
    const availableProvider = provider || localProvider;
    if (availableProvider) {
        await loadContract();
    } else {
        console.log('ℹ️ Provider no disponible aún. El contrato se cargará cuando se conecte una wallet.');
    }
}

// Función para obtener el número de decimales del token
async function getTokenDecimals() {
    // Si ya se obtuvo el valor del contrato (incluso si es 0), retornarlo
    // Usamos un flag adicional para saber si ya consultamos al contrato
    if (typeof tokenDecimals === 'number') {
        console.log(`📊 Usando decimales en caché: ${tokenDecimals}`);
        return tokenDecimals;
    }
    
    if (!contract) {
        console.warn('⚠️ Contrato no cargado, usando decimales por defecto (0)');
        tokenDecimals = 0;
        return 0;
    }
    
    try {
        const decimals = await contract.decimals();
        tokenDecimals = decimals; // Guardar el valor (incluso si es 0)
        console.log(`📊 Decimales del token obtenidos del contrato: ${tokenDecimals}`);
        return tokenDecimals;
    } catch (error) {
        console.warn('⚠️ Error al obtener decimales del token, usando 0:', error);
        // Si hay error, intentar asumir 0 decimales (ya que el valor mostrado en Remix es sin decimales)
        tokenDecimals = 0;
        return 0;
    }
}

// Función para formatear balance usando los decimales correctos del token
function formatTokenAmount(amount, decimals) {
    // Validar entrada
    if (amount === null || amount === undefined) {
        console.warn('⚠️ formatTokenAmount recibió valor null/undefined');
        return '0';
    }
    
    // Asegurarse de que amount sea un BigNumber
    let bnAmount;
    try {
        bnAmount = ethers.BigNumber.from(amount);
    } catch (e) {
        console.error('❌ Error al convertir amount a BigNumber:', e);
        return '0';
    }
    
    // Si decimals es 0 o no está definido, retornar el valor directamente sin conversión
    if (decimals === 0 || decimals === null || decimals === undefined) {
        return bnAmount.toString();
    }
    
    // Para tokens con decimales, dividir
    const divisor = ethers.BigNumber.from(10).pow(decimals);
    const whole = bnAmount.div(divisor);
    const fractional = bnAmount.mod(divisor);
    
    if (fractional.isZero()) {
        return whole.toString();
    }
    
    const fractionalStr = fractional.toString().padStart(decimals, '0');
    // Remover ceros finales innecesarios
    const trimmedFractional = fractionalStr.replace(/0+$/, '');
    if (trimmedFractional === '') {
        return whole.toString();
    }
    return `${whole.toString()}.${trimmedFractional}`;
}

// Función para parsear cantidad de tokens usando los decimales correctos
function parseTokenAmount(amount, decimals) {
    if (decimals === 0) {
        return ethers.BigNumber.from(amount.toString());
    }
    return ethers.utils.parseUnits(amount.toString(), decimals);
}

// Función para obtener balance de tokens de una cuenta
async function getTokenBalance(address) {
    // Verificar que ethers esté disponible
    if (typeof ethers === 'undefined') {
        console.warn('⚠️ ethers no disponible');
        return accountBalances[address] || 0;
    }
    
    if (!contract) {
        console.warn('⚠️ Contrato no cargado, retornando balance simulado');
        return accountBalances[address] || 0;
    }
    
    try {
        const balance = await contract.balanceOf(address);
        // Retornar el valor uint256 directamente como número (igual que Remix)
        const balanceNum = parseFloat(balance.toString());
        console.log(`💰 Balance de ${address.substring(0, 10)}...: ${balanceNum} tokens (uint256: ${balance.toString()})`);
        return balanceNum;
    } catch (error) {
        console.error('❌ Error al obtener balance del contrato:', error);
        // Fallback a simulación si falla
        return accountBalances[address] || 0;
    }
}

// Función para obtener balance de ETH de una cuenta (útil para gas)
// NOTA: ETH siempre tiene 18 decimales, así que aquí sí usamos formatEther
async function getETHBalance(address) {
    if (!provider) return '0';
    
    try {
        const balance = await provider.getBalance(address);
        return ethers.utils.formatEther(balance);
    } catch (error) {
        console.error('Error al obtener balance de ETH:', error);
        return '0';
    }
}

// Función para cargar balances de todas las cuentas
async function loadAccountBalances() {
    console.log('📊 Cargando balances...', {
        useLocalNode,
        hasProvider: !!provider,
        hasContract: !!contract,
        hasSigner: !!signer
    });
    
    for (const [role, account] of Object.entries(ACCOUNTS)) {
        try {
            const balance = await getTokenBalance(account.address);
            accountBalances[account.address] = balance;
            console.log(`  ${role}: ${balance} tokens`);
            
            // Guardar balance inicial del banco (Admin) la primera vez
            if (role === 'Admin' && initialBankBalance === 0) {
                initialBankBalance = balance;
                console.log(`📊 Balance inicial del banco guardado: ${initialBankBalance}`);
            }
        } catch (error) {
            console.error(`❌ Error al cargar balance de ${role}:`, error);
            accountBalances[account.address] = accountBalances[account.address] || 0;
        }
    }
    
    updateAccountBalancesUI();
    console.log('✅ Balances cargados');
}

// Función para comprar tokens (banco genera y vende)
async function buyTokens(accountAddress, amount) {
    if (!contract || !signer) {
        console.log('Simulando compra de tokens...');
        // Simulación temporal
        accountBalances[accountAddress] = (accountBalances[accountAddress] || 0) + amount;
        soldTokens += amount;
        totalTokens += amount;
        await updateBankUI();
        updateAccountBalancesUI();
        return true;
    }
    
    try {
        // Cuando tengas el contrato, usar algo como:
        // const tx = await contract.buyTokens(accountAddress, { value: ethers.utils.parseEther(amount.toString()) });
        // await tx.wait();
        return true;
    } catch (error) {
        console.error('Error al comprar tokens:', error);
        return false;
    }
}

// Función para comprar vidas
async function buyLives(accountAddress, livesCount) {
    const cost = livesCount * PRICE_PER_LIFE;
    
    if (!contract || !signer) {
        // Modo simulación
        const balance = accountBalances[accountAddress] || 0;
        if (balance < cost) {
            alert('No tienes suficientes tokens');
            return false;
        }
        
        accountBalances[accountAddress] -= cost;
        soldTokens -= cost; // Los tokens vuelven al banco
        await updateBankUI();
        updateAccountBalancesUI();
        
        // Establecer las vidas del juego (no sumar)
        if (window.gameInstance) {
            window.gameInstance.setLives(livesCount);
        }
        console.log(`✅ Vidas compradas: ${livesCount} por ${accountAddress}, coste: ${cost} tokens`);
        return true;
    }
    
    // Modo blockchain: transferir tokens del jugador al banco (Admin)
    try {
        console.log('🔄 Comprando vidas con blockchain:', {
            accountAddress,
            livesCount,
            cost,
            hasContract: !!contract,
            hasSigner: !!signer
        });
        
        // Verificar que el contrato esté accesible
        try {
            const code = await (provider || localProvider)?.getCode(CONTRACT_ADDRESS);
            if (!code || code === '0x' || code === '0x0') {
                console.error('❌ No hay código de contrato en', CONTRACT_ADDRESS);
                // Fallback a modo simulación
                const balance = accountBalances[accountAddress] || 0;
                if (balance < cost) {
                    alert('No tienes suficientes tokens');
                    return false;
                }
                accountBalances[accountAddress] -= cost;
                soldTokens -= cost;
                await updateBankUI();
                updateAccountBalancesUI();
                if (window.gameInstance) {
                    window.gameInstance.setLives(livesCount);
                }
                return true;
            }
        } catch (codeError) {
            console.error('❌ Error al verificar código del contrato:', codeError);
        }
        
        // Obtener dirección del Admin/creator desde el contrato
        let adminAddress;
        try {
            adminAddress = await contract.creator();
            console.log('👤 Admin/creator del contrato:', adminAddress);
        } catch (creatorError) {
            console.error('❌ Error al obtener creator:', creatorError);
            adminAddress = ADMIN_ADDRESS; // Usar constante como fallback
        }
        
        // Verificar que el signer sea el jugador que está comprando
        const signerAddress = await signer.getAddress();
        if (signerAddress.toLowerCase() !== accountAddress.toLowerCase()) {
            console.error('❌ El signer no coincide con el jugador activo');
            alert('Debes estar conectado con la cuenta del jugador activo para comprar vidas');
            return false;
        }
        
        // Crear instancia del contrato con signer del jugador
        const contractWithSigner = contract.connect(signer);
        
        // Convertir cost a BigNumber (uint256)
        const costWei = ethers.BigNumber.from(cost.toString());
        console.log(`💰 Costo a transferir: ${cost} tokens -> ${costWei.toString()} (uint256)`);
        
        // Verificar balance del jugador DESDE EL CONTRATO antes de transferir
        const playerBalance = await contract.balanceOf(accountAddress);
        console.log(`💰 Balance del jugador consultado del contrato (uint256): ${playerBalance.toString()}`);
        
        if (playerBalance.lt(costWei)) {
            const balanceNum = parseFloat(playerBalance.toString());
            alert(`No tienes suficientes tokens. Balance en contrato: ${balanceNum}, Costo: ${cost}`);
            return false;
        }
        
        // Estimar gas para la transferencia
        let gasEstimate;
        try {
            gasEstimate = await contractWithSigner.estimateGas.transfer(adminAddress, costWei);
            console.log(`⛽ Gas estimado: ${gasEstimate.toString()}`);
        } catch (estimateError) {
            console.error('❌ Error al estimar gas:', estimateError);
            if (estimateError.reason) {
                alert(`Error: ${estimateError.reason}`);
                return false;
            }
            alert(`Error al estimar gas: ${estimateError.message}`);
            return false;
        }
        
        // Realizar transferencia desde jugador a Admin (banco)
        console.log(`📤 Transfiriendo ${cost} tokens desde ${accountAddress} al banco (${adminAddress})...`);
        const tx = await contractWithSigner.transfer(adminAddress, costWei, {
            gasLimit: gasEstimate.mul(120).div(100) // Aumentar 20% por seguridad
        });
        
        console.log(`⏳ Transacción enviada:`, tx.hash);
        
        // Esperar confirmación
        const receipt = await tx.wait();
        
        if (receipt.status !== 1) {
            throw new Error('Transacción revertida');
        }
        
        console.log(`✅ Transferencia confirmada, block:`, receipt.blockNumber);
        
        // Actualizar balances locales
        accountBalances[accountAddress] -= cost;
        
        // Actualizar tokens vendidos (los tokens vuelven al banco, así que disminuimos soldTokens)
        // Usar la misma lógica que en el modo simulación: soldTokens -= cost
        // porque los tokens están volviendo al banco
        try {
            // Calcular soldTokens como la diferencia entre balance inicial y actual del Admin
            // Esto es más preciso que usar getTransferFrom porque captura todas las transferencias
            const currentAdminBalance = await contract.balanceOf(adminAddress);
            const adminBalanceNum = parseFloat(currentAdminBalance.toString());
            
            // Si tenemos balance inicial, calcular diferencia
            if (initialBankBalance > 0) {
                soldTokens = Math.max(0, initialBankBalance - adminBalanceNum);
            } else {
                // Si no tenemos balance inicial, intentar obtenerlo del totalSupply
                // pero solo establecerlo si no está establecido (no sobrescribir)
                try {
                    const totalSupply = await contract.totalSupply();
                    const supplyNum = parseFloat(totalSupply.toString());
                    if (initialBankBalance === 0) {
                        initialBankBalance = supplyNum;
                        console.log(`📊 Balance inicial del banco establecido desde totalSupply: ${initialBankBalance}`);
                    }
                    soldTokens = Math.max(0, supplyNum - adminBalanceNum);
                } catch (supplyError) {
                    // Fallback: restar el costo (tokens vuelven al banco)
                    soldTokens = Math.max(0, parseFloat(soldTokens || 0) - cost);
                }
            }
            
            console.log(`💰 Tokens vendidos recalculados: ${soldTokens} (balance Admin: ${adminBalanceNum}, inicial: ${initialBankBalance})`);
        } catch (error) {
            console.error('❌ Error al calcular tokens vendidos:', error);
            // Fallback: restar el costo (tokens vuelven al banco)
            soldTokens = Math.max(0, parseFloat(soldTokens || 0) - cost);
            console.log(`⚠️ Usando cálculo de fallback para tokens vendidos: ${soldTokens}`);
        }
        
        // Actualizar UI
        await loadAccountBalances();
        await updateBankUI();
        updateAccountBalancesUI();
        
        // Establecer las vidas del juego (no sumar)
        if (window.gameInstance) {
            window.gameInstance.setLives(livesCount);
        }
        
        console.log(`✅ Vidas compradas exitosamente: ${livesCount} por ${accountAddress}, coste: ${cost} tokens`);
        return true;
        
    } catch (error) {
        console.error('❌ Error al comprar vidas:', error);
        alert(`Error al comprar vidas: ${error.message || error.reason || 'Error desconocido'}`);
        return false;
    }
}

// Función para hacer apuesta
async function placeBet(accountAddress, betAmount) {
    console.log('🎲 placeBet llamado:', { accountAddress, betAmount });
    
    // Validación opcional: si hay un jugador activo, no puede apostar sobre su propio juego
    if (activePlayerAccount && accountAddress === activePlayerAccount) {
        alert('No puedes apostar sobre tu propio juego');
        return false;
    }
    
    if (!contract || !signer) {
        // Modo simulación: solo actualizar balances locales
        console.log('📊 Modo simulación: actualizando balances locales');
        const balance = accountBalances[accountAddress] || 0;
        
        if (balance < betAmount) {
            alert('No tienes suficientes tokens para esta apuesta');
            return false;
        }
        
        accountBalances[accountAddress] -= betAmount;
        const previousBet = currentBets[accountAddress] || 0;
        currentBets[accountAddress] = previousBet + betAmount;
        // Actualizar bolsa apostada: sumar la diferencia (nuevo monto - monto anterior)
        stakedPotAmount = stakedPotAmount - previousBet + currentBets[accountAddress];
        updateAccountBalancesUI();
        updateBettingCards();
        updateStakedPotUI();
        return true;
    }
    
    try {
        // Verificar que el jugador que apuesta esté conectado (para poder firmar la transacción)
        const connectedAddress = (await signer.getAddress()).toLowerCase();
        const betAddressLower = accountAddress.toLowerCase();
        
        if (connectedAddress !== betAddressLower) {
            alert(`Debes estar conectado con la cuenta ${accountAddress} para apostar. Cuenta conectada: ${connectedAddress}`);
            return false;
        }
        
        // Calcular cuánto debe transferir (la diferencia entre la nueva apuesta total y la apuesta anterior)
        const previousBet = currentBets[accountAddress] || 0;
        const amountToTransfer = betAmount; // La cantidad que está apostando ahora
        
        console.log(`💰 Apuesta anterior: ${previousBet}, Apuesta nueva: ${betAmount}, Total a transferir ahora: ${amountToTransfer}`);
        
        // Verificar balance del jugador desde el contrato
        const playerBalance = await contract.balanceOf(accountAddress);
        const playerBalanceNum = parseFloat(playerBalance.toString());
        console.log(`💰 Balance del jugador en contrato: ${playerBalanceNum}`);
        
        // Verificar que tenga suficientes tokens (necesita tener al menos la cantidad que quiere apostar)
        const amountToTransferWei = ethers.BigNumber.from(amountToTransfer.toString());
        if (playerBalance.lt(amountToTransferWei)) {
            alert(`No tienes suficientes tokens. Balance en contrato: ${playerBalanceNum}, Intento de apuesta: ${amountToTransfer}`);
            return false;
        }
        
        // Hacer transferencia real desde el jugador al banco (Admin)
        const contractWithSigner = contract.connect(signer);
        console.log(`💸 Transfiriendo ${amountToTransfer} tokens desde ${accountAddress} al banco (${ADMIN_ADDRESS})...`);
        
        // Estimar gas para la transferencia
        let gasEstimate;
        try {
            gasEstimate = await contractWithSigner.estimateGas.transfer(ADMIN_ADDRESS, amountToTransferWei);
            console.log(`⛽ Gas estimado: ${gasEstimate.toString()}`);
        } catch (gasError) {
            console.error('❌ Error al estimar gas:', gasError);
            throw gasError;
        }
        
        // Hacer la transferencia
        const tx = await contractWithSigner.transfer(ADMIN_ADDRESS, amountToTransferWei, {
            gasLimit: gasEstimate.mul(120).div(100) // Aumentar 20% por seguridad
        });
        
        console.log(`⏳ Transacción enviada:`, tx.hash);
        
        // Esperar confirmación
        const receipt = await tx.wait();
        
        if (receipt.status !== 1) {
            throw new Error('Transacción revertida');
        }
        
        console.log(`✅ Transferencia confirmada, block:`, receipt.blockNumber);
        
        // Actualizar estado local: sumar la nueva apuesta a la anterior
        currentBets[accountAddress] = previousBet + amountToTransfer;
        stakedPotAmount = stakedPotAmount - previousBet + currentBets[accountAddress];
        
        // Recargar balances desde blockchain para asegurar consistencia
        await loadAccountBalances();
        
        // Actualizar UI
        updateAccountBalancesUI();
        updateBettingCards();
        updateStakedPotUI();
        
        console.log(`✅ Apuesta realizada exitosamente: ${amountToTransfer} tokens transferidos al banco. Apuesta total: ${currentBets[accountAddress]}`);
        return true;
        
    } catch (error) {
        console.error('❌ Error al hacer apuesta:', error);
        alert(`Error al realizar la apuesta: ${error.message || error.reason || 'Error desconocido'}`);
        return false;
    }
}

// Función para distribuir ganancias (apuestas)
async function distributeWinnings(winnerAddress, totalPot) {
    console.log('🎲 Distribuyendo ganancias:', {
        winnerAddress,
        totalPot,
        hasContract: !!contract,
        hasSigner: !!signer
    });
    
    if (!contract || !signer) {
        // Modo simulación: solo actualizar balances locales
        console.log('📊 Modo simulación: actualizando balances locales');
        accountBalances[winnerAddress] = (accountBalances[winnerAddress] || 0) + totalPot;
        updateAccountBalancesUI();
        return true;
    }
    
    try {
        console.log('🔗 Modo blockchain: intentando transferir tokens desde apostadores al ganador');
        
        // El contrato actual no tiene sistema de escrow para apuestas
        // Por lo tanto, las apuestas se manejaron en modo simulación
        // Solo transferimos los tokens acumulados al ganador
        const contractWithSigner = contract.connect(signer);
        
        // Convertir totalPot a uint256 (BigNumber)
        const totalPotWei = ethers.BigNumber.from(totalPot.toString());
        console.log(`💰 Cantidad a transferir (uint256): ${totalPotWei.toString()}`);
        
        // El problema es que los tokens de las apuestas están en currentBets (estado local)
        // No hay manera de transferirlos en blockchain sin un sistema de escrow
        // Por ahora, dejamos que el modo simulación maneje esto
        console.log('⚠️ Sistema de apuestas en modo simulación - no hay transferencia blockchain');
        accountBalances[winnerAddress] = (accountBalances[winnerAddress] || 0) + totalPot;
        updateAccountBalancesUI();
        
        return true;
    } catch (error) {
        console.error('❌ Error al distribuir ganancias:', error);
        // Fallback a modo simulación
        accountBalances[winnerAddress] = (accountBalances[winnerAddress] || 0) + totalPot;
        updateAccountBalancesUI();
        return true;
    }
}

// Función para reiniciar: transferir todos los tokens de jugadores de vuelta a Admin
async function resetTokensToAdmin() {
    if (!contract) {
        console.error('❌ Contrato no disponible');
        return { success: false, message: 'Contrato no cargado. Verifique la conexión.' };
    }
    
    // Verificar que el contrato esté accesible
    try {
        const code = await (provider || localProvider)?.getCode(CONTRACT_ADDRESS);
        if (!code || code === '0x' || code === '0x0') {
            return { 
                success: false, 
                message: `No hay código de contrato en ${CONTRACT_ADDRESS}. Verifique que el contrato esté desplegado.` 
            };
        }
    } catch (codeError) {
        console.error('❌ Error al verificar código del contrato:', codeError);
    }
    
    if (!signer) {
        return { success: false, message: 'Wallet no conectada. Por favor conecte su wallet.' };
    }
    
    // Verificar que la cuenta conectada sea el Admin
    if (!connectedAccount) {
        return { success: false, message: 'No hay cuenta conectada' };
    }
    
    if (connectedAccount.toLowerCase() !== ADMIN_ADDRESS.toLowerCase()) {
        return { success: false, message: 'Solo el Admin puede reiniciar tokens' };
    }
    
    try {
        console.log('🔄 Iniciando reinicio de tokens: devolviendo todos los tokens de jugadores a Admin');
        
        const players = [
            ACCOUNTS["Jugador 1"].address,
            ACCOUNTS["Jugador 2"].address,
            ACCOUNTS["Jugador 3"].address,
            ACCOUNTS["Jugador 4"].address
        ];
        
        const results = [];
        const contractWithSigner = contract.connect(signer);
        
        // Obtener el Admin address desde el contrato para asegurar consistencia
        let creatorAddress;
        try {
            creatorAddress = await contract.creator();
        } catch (creatorError) {
            console.error('❌ Error al obtener creator:', creatorError);
            creatorAddress = ADMIN_ADDRESS; // Usar constante como fallback
        }
        
        // Para cada jugador, obtener su balance y transferir todo a Admin
        for (let i = 0; i < players.length; i++) {
            const playerAddress = players[i];
            const playerName = ACCOUNTS[`Jugador ${i+1}`].role;
            
            try {
                // Obtener balance del jugador
                const playerBalance = await contract.balanceOf(playerAddress);
                
                console.log(`📊 Balance de ${playerName}: ${playerBalance.toString()}`);
                
                // Si el jugador no tiene tokens, saltar
                if (playerBalance.isZero()) {
                    console.log(`⏭️ ${playerName} no tiene tokens, saltando...`);
                    results.push({
                        address: playerAddress,
                        success: true,
                        skipped: true,
                        playerName: playerName,
                        tokensReturned: '0'
                    });
                    continue;
                }
                
                // Crear un signer para el jugador usando el provider local o MetaMask
                // En desarrollo local, podemos usar el provider para crear signers de otras cuentas
                let playerSigner;
                
                if (useLocalNode && localProvider) {
                    // En Anvil local, podemos crear signers para cualquier cuenta
                    // Las cuentas de Anvil tienen claves privadas conocidas
                    try {
                        playerSigner = localProvider.getSigner(playerAddress);
                    } catch (signerError) {
                        console.warn(`⚠️ No se pudo crear signer para ${playerName}, intentando con provider...`);
                        // Intentar usar el provider actual si está disponible
                        if (provider) {
                            playerSigner = provider.getSigner(playerAddress);
                        } else {
                            throw new Error(`No se puede crear signer para ${playerName}. Solo funciona en Anvil local o si la cuenta está conectada.`);
                        }
                    }
                } else {
                    // En MetaMask, solo podemos usar la cuenta conectada
                    // Necesitamos que cada jugador esté conectado o usar transferFrom con aprobación
                    // Por ahora, intentamos crear signer con provider
                    try {
                        if (provider) {
                            playerSigner = provider.getSigner(playerAddress);
                        } else {
                            throw new Error(`No se puede crear signer para ${playerName}. En MetaMask, cada jugador debe estar conectado para transferir.`);
                        }
                    } catch (signerError) {
                        // Si no se puede crear signer, el jugador debe estar conectado manualmente
                        console.warn(`⚠️ ${playerName} no está conectado. Para reiniciar, cada jugador debe conectarse y transferir manualmente.`);
                        results.push({
                            address: playerAddress,
                            success: false,
                            error: `${playerName} no está conectado. Necesita conectarse con MetaMask para transferir tokens.`,
                            playerName: playerName
                        });
                        continue;
                    }
                }
                
                // Crear contrato con signer del jugador para hacer transfer
                const playerContract = contract.connect(playerSigner);
                
                console.log(`📤 ${playerName} transfiriendo ${playerBalance.toString()} tokens a Admin...`);
                
                // Estimar gas
                let gasEstimate;
                try {
                    gasEstimate = await playerContract.estimateGas.transfer(creatorAddress, playerBalance);
                    console.log(`⛽ Gas estimado para ${playerName}: ${gasEstimate.toString()}`);
                } catch (estimateError) {
                    console.error(`❌ Error al estimar gas para ${playerName}:`, estimateError);
                    if (estimateError.reason) {
                        throw new Error(`Error: ${estimateError.reason}`);
                    }
                    throw new Error(`Error al estimar gas: ${estimateError.message}`);
                }
                
                // Realizar transfer desde jugador a Admin
                const tx = await playerContract.transfer(creatorAddress, playerBalance, {
                    gasLimit: gasEstimate.mul(120).div(100)
                });
                
                console.log(`⏳ Transacción enviada (${i+1}/4):`, tx.hash);
                
                // Esperar confirmación
                const receipt = await tx.wait();
                
                if (receipt.status !== 1) {
                    throw new Error('Transacción revertida');
                }
                
                console.log(`✅ Tokens de ${playerName} devueltos a Admin, block:`, receipt.blockNumber);
                
                results.push({
                    address: playerAddress,
                    success: true,
                    txHash: tx.hash,
                    playerName: playerName,
                    tokensReturned: playerBalance.toString()
                });
                
            } catch (error) {
                console.error(`❌ Error al reiniciar tokens de ${playerName}:`, error);
                results.push({
                    address: playerAddress,
                    success: false,
                    error: error.message || error.reason || 'Error desconocido',
                    playerName: playerName
                });
            }
        }
        
        // Actualizar balances después del reinicio
        await loadAccountBalances();
        await updateBankUI();
        
        const successful = results.filter(r => r.success && !r.skipped).length;
        const skipped = results.filter(r => r.skipped).length;
        const failed = results.filter(r => !r.success).length;
        
        if (successful === players.length || (successful + skipped) === players.length) {
            return {
                success: true,
                message: `✅ Reinicio completado: ${successful} jugadores devolvieron tokens, ${skipped} no tenían tokens`,
                results: results
            };
        } else if (successful > 0) {
            const errorDetails = results.filter(r => !r.success).map(r => 
                `${r.playerName}: ${r.error || 'Error desconocido'}`
            ).join(', ');
            return {
                success: false,
                message: `Reinicio parcial: ${successful} exitosos, ${failed} fallidos. Errores: ${errorDetails}`,
                results: results
            };
        } else {
            const errorDetails = results.filter(r => !r.success).map(r => 
                `${r.playerName}: ${r.error || 'Error desconocido'}`
            ).join(', ');
            return {
                success: false,
                message: `No se pudieron reiniciar tokens. Errores: ${errorDetails}`,
                results: results
            };
        }
        
    } catch (error) {
        console.error('❌ Error en reinicio de tokens:', error);
        return {
            success: false,
            message: `Error al reiniciar tokens: ${error.message || error.reason || 'Error desconocido'}`
        };
    }
}

// Handler para el botón Reiniciar
async function handleResetTokens() {
    const resetBtn = document.getElementById('resetBtn');
    if (!resetBtn) {
        alert('Error: botón Reiniciar no encontrado');
        return;
    }
    
    // Confirmación antes de reiniciar
    const confirmReset = confirm('¿Está seguro de que desea reiniciar? Esto transferirá todos los tokens de los jugadores de vuelta al banco (Admin).');
    if (!confirmReset) {
        return;
    }
    
    resetBtn.disabled = true;
    resetBtn.textContent = 'Reiniciando...';
    
    try {
        const result = await resetTokensToAdmin();
        
        if (result.success) {
            alert(`✅ ${result.message}`);
        } else {
            alert(`❌ ${result.message}`);
        }
    } catch (error) {
        console.error('Error en handleResetTokens:', error);
        alert(`❌ Error: ${error.message || 'Error desconocido'}`);
    } finally {
        resetBtn.disabled = false;
        resetBtn.textContent = 'Reiniciar';
    }
}

// Función para distribuir tokens desde Admin a los jugadores
async function distributeTokensFromAdmin(amount) {
    if (!contract) {
        console.error('❌ Contrato no disponible');
        return { success: false, message: 'Contrato no cargado. Verifique la conexión.' };
    }
    
    // Verificar que el contrato esté accesible antes de continuar
    try {
        // Intentar leer una función view simple para verificar que el contrato existe
        const code = await (provider || localProvider)?.getCode(CONTRACT_ADDRESS);
        if (!code || code === '0x' || code === '0x0') {
            return { 
                success: false, 
                message: `No hay código de contrato en ${CONTRACT_ADDRESS}. Verifique que el contrato esté desplegado en esta dirección.` 
            };
        }
    } catch (codeError) {
        console.error('❌ Error al verificar código del contrato:', codeError);
    }
    
    if (!signer) {
        console.error('❌ Signer no disponible');
        return { success: false, message: 'Wallet no conectada. Por favor conecte su wallet.' };
    }
    
    // Verificar que la cuenta conectada sea el Admin
    if (!connectedAccount) {
        return { success: false, message: 'No hay cuenta conectada' };
    }
    
    if (connectedAccount.toLowerCase() !== ADMIN_ADDRESS.toLowerCase()) {
        console.error('❌ Intento de distribución por cuenta no admin:', connectedAccount);
        return { success: false, message: 'Solo el Admin puede distribuir tokens' };
    }
    
    try {
        console.log('🔄 Iniciando distribución de tokens:', amount, 'a 4 jugadores');
        const players = [
            ACCOUNTS["Jugador 1"].address,
            ACCOUNTS["Jugador 2"].address,
            ACCOUNTS["Jugador 3"].address,
            ACCOUNTS["Jugador 4"].address
        ];
        
        const results = [];
        
        // Asegurarse de que el contrato use el signer
        if (!signer) {
            console.error('❌ Signer no disponible para hacer transacciones');
            throw new Error('Signer no disponible. Por favor conecte su wallet.');
        }
        
        // Verificar que el contrato esté cargado
        if (!contract) {
            console.error('❌ Contrato no cargado');
            // Intentar recargar el contrato
            await loadContract();
            if (!contract) {
                throw new Error('No se pudo cargar el contrato. Verifique la conexión.');
            }
        }
        
        console.log('🔍 Verificando configuración:', {
            hasContract: !!contract,
            hasSigner: !!signer,
            signerAddress: signer ? await signer.getAddress() : 'N/A',
            adminAddress: ADMIN_ADDRESS
        });
        
        // Crear una instancia del contrato con signer para hacer transacciones
        const contractWithSigner = contract.connect(signer);
        console.log('✅ Contrato conectado con signer');
        
        // Convertir amount directamente a BigNumber (uint256) sin conversión de decimales
        // El smart contract espera y valida los valores, no hay que convertir
        const amountWei = ethers.BigNumber.from(amount.toString());
        console.log(`💰 Cantidad a distribuir (uint256): ${amountWei.toString()}`);
        
        // Verificar que el caller sea el creator del contrato ANTES del loop
        let creatorAddress;
        try {
            creatorAddress = await contract.creator();
            console.log('👤 Creator del contrato:', creatorAddress);
        } catch (creatorError) {
            console.error('❌ Error al obtener creator del contrato:', creatorError);
            throw new Error(`No se pudo obtener la dirección del creator del contrato. Verifique que el contrato esté correctamente desplegado. Error: ${creatorError.message || creatorError.code || 'Desconocido'}`);
        }
        
        const signerAddress = await signer.getAddress();
        console.log('👤 Dirección del signer:', signerAddress);
        
        if (creatorAddress.toLowerCase() !== signerAddress.toLowerCase()) {
            throw new Error(`El signer (${signerAddress}) no es el creator del contrato (${creatorAddress}). Solo el creator puede usar transferFromCreator.`);
        }
        
        // Obtener balance del creator para logs (sin conversión, valor crudo uint256)
        let creatorBalance;
        try {
            creatorBalance = await contract.balanceOf(creatorAddress);
            console.log(`💰 Balance del creator (uint256): ${creatorBalance.toString()}`);
        } catch (balanceError) {
            console.warn('⚠️ Error al obtener balance del creator (continuando de todos modos):', balanceError);
            // Continuar sin el balance, el contrato lo validará
        }
        
        console.log(`💰 Cantidad a distribuir por jugador (uint256): ${amountWei.toString()}`);
        
        // NO validar balance aquí - el smart contract lo valida
        
        // Distribuir a cada jugador
        for (let i = 0; i < players.length; i++) {
            const playerAddress = players[i];
            try {
                const playerName = ACCOUNTS[`Jugador ${i+1}`].role;
                console.log(`📤 Distribuyendo ${amount} tokens a ${playerName} (${playerAddress})...`);
                
                // Validar que la dirección del jugador sea válida
                if (!ethers.utils.isAddress(playerAddress)) {
                    throw new Error(`Dirección inválida: ${playerAddress}`);
                }
                
                console.log(`📝 Llamando transferFromCreator(${playerAddress}, ${amountWei.toString()})`);
                
                // Llamar a la función del contrato con el signer
                // transferFromCreator(address to, uint256 amount)
                // Primero intentar estimar el gas para detectar errores temprano
                let gasEstimate;
                try {
                    gasEstimate = await contractWithSigner.estimateGas.transferFromCreator(playerAddress, amountWei);
                    console.log(`⛽ Gas estimado: ${gasEstimate.toString()}`);
                } catch (estimateError) {
                    console.error('❌ Error al estimar gas (la transacción probablemente fallará):', estimateError);
                    // Intentar obtener más detalles del error
                    if (estimateError.reason) {
                        throw new Error(`Error: ${estimateError.reason}`);
                    }
                    throw new Error(`Error al estimar gas: ${estimateError.message}`);
                }
                
                const tx = await contractWithSigner.transferFromCreator(playerAddress, amountWei, {
                    gasLimit: gasEstimate.mul(120).div(100) // Aumentar 20% por seguridad
                });
                console.log(`⏳ Transacción enviada (${i+1}/4):`, tx.hash);
                
                // Esperar confirmación
                const receipt = await tx.wait();
                
                // Verificar que la transacción fue exitosa
                if (receipt.status !== 1) {
                    throw new Error('Transacción revertida');
                }
                
                console.log(`✅ Confirmación recibida para ${playerName}, block:`, receipt.blockNumber);
                
                results.push({
                    address: playerAddress,
                    success: true,
                    txHash: tx.hash,
                    playerName: playerName,
                    tokensTransferred: amountWei.toString()
                });
                console.log(`✅ Tokens distribuidos exitosamente a ${playerName}, tx: ${tx.hash}`);
            } catch (error) {
                const playerName = ACCOUNTS[`Jugador ${i+1}`].role;
                console.error(`❌ Error al distribuir a ${playerName}:`, error);
                console.error('Detalles del error:', {
                    message: error.message,
                    code: error.code,
                    data: error.data,
                    reason: error.reason
                });
                results.push({
                    address: playerAddress,
                    success: false,
                    error: error.message || error.reason || 'Error desconocido',
                    playerName: playerName
                });
            }
        }
        
        // Actualizar balances después de la distribución
        await loadAccountBalances();
        
        // Calcular tokens vendidos usando getTransferFrom del contrato
        // Esta función retorna todas las transferencias realizadas por el Admin (banco)
        try {
            // Asegurarse de tener creatorAddress antes de llamar getTransferFrom
            let creatorAddr = creatorAddress;
            if (!creatorAddr) {
                creatorAddr = await contract.creator();
            }
            
            const transfersFromAdmin = await contract.getTransferFrom(creatorAddr);
            console.log(`📊 Transferencias desde Admin obtenidas del contrato:`, transfersFromAdmin.length);
            
            // Sumar todos los amounts de las transferencias realizadas por el banco
            let totalSold = ethers.BigNumber.from(0);
            for (const transfer of transfersFromAdmin) {
                totalSold = totalSold.add(transfer.amount);
            }
            
            // Actualizar tokens vendidos con el valor total del contrato
            soldTokens = parseFloat(totalSold.toString());
            console.log(`💰 Tokens vendidos totales calculados desde contrato: ${soldTokens}`);
        } catch (error) {
            console.error('❌ Error al obtener transferencias desde Admin:', error);
            // Si falla, usar amountWei como fallback solo para esta distribución
            const successfulCount = results.filter(r => r.success).length;
            if (successfulCount > 0) {
                const distributedAmount = amountWei.mul(successfulCount);
                soldTokens = parseFloat(soldTokens || 0) + parseFloat(distributedAmount.toString());
                console.log(`⚠️ Usando cálculo de fallback para tokens vendidos: ${soldTokens}`);
            }
        }
        
        await updateBankUI(); // Actualizar estadísticas del banco (tokens vendidos)
        
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        
        if (successful === players.length) {
            return {
                success: true,
                message: `✅ Tokens distribuidos exitosamente a los ${successful} jugadores`,
                results: results
            };
        } else if (successful > 0) {
            const errorDetails = results.filter(r => !r.success).map(r => 
                `${r.playerName}: ${r.error || 'Error desconocido'}`
            ).join(', ');
            return {
                success: false,
                message: `Distribuidos tokens a ${successful} de ${players.length} jugadores. Errores: ${errorDetails}`,
                results: results
            };
        } else {
            const errorDetails = results.map(r => 
                `${r.playerName}: ${r.error || 'Error desconocido'}`
            ).join('; ');
            return {
                success: false,
                message: `Error: No se pudieron distribuir tokens a ningún jugador. ${errorDetails}`,
                results: results
            };
        }
    } catch (error) {
        console.error('❌ Error en distribución de tokens:', error);
        return { success: false, message: error.message };
    }
}

// Handlers de eventos de MetaMask
async function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        connectedAccount = null;
        updateWalletStatus(false);
    } else {
        connectedAccount = accounts[0];
        // Recargar provider y signer
        if (typeof window.ethereum !== 'undefined') {
            provider = new ethers.providers.Web3Provider(window.ethereum);
            signer = provider.getSigner();
            useLocalNode = false;
            
            if (contractABI && CONTRACT_ADDRESS) {
                await loadContract();
            }
            
            // Refrescar balances después de cambiar cuenta
            await loadAccountBalances();
            await updateBankUI();
            updateWalletStatus(true);
        }
    }
}

function handleChainChanged(chainId) {
    window.location.reload();
}

// UI Functions
function setupUI() {
    console.log('🎨 Configurando UI...');
    
    // Botón conectar MetaMask
    const connectBtn = document.getElementById('connectWalletBtn');
    if (!connectBtn) {
        console.error('❌ Botón connectWalletBtn no encontrado en el DOM');
        // Reintentar después de un breve delay
        setTimeout(() => {
            const retryBtn = document.getElementById('connectWalletBtn');
            if (retryBtn) {
                console.log('✅ Botón encontrado en reintento');
                retryBtn.addEventListener('click', connectWallet);
            } else {
                console.error('❌ Botón aún no disponible después del reintento');
            }
        }, 500);
        return;
    }
    
    console.log('✅ Botón connectWalletBtn encontrado, agregando listener...');
    connectBtn.addEventListener('click', (e) => {
        console.log('🖱️ Click en botón Conectar con MetaMask');
        e.preventDefault();
        connectWallet();
    });
    
    // Botón distribuir tokens (Admin) - en el header
    const distributeBtn = document.getElementById('distributeBtn');
    if (distributeBtn) {
        console.log('✅ Botón Distribuir encontrado, agregando listener...');
        distributeBtn.addEventListener('click', (e) => {
            console.log('🖱️ Click en botón Distribuir');
            e.preventDefault();
            openDistributeModal();
        });
    } else {
        console.warn('⚠️ Botón Distribuir no encontrado en el DOM');
    }
    
    // Botón reiniciar tokens (Admin) - en el header
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        console.log('✅ Botón Reiniciar encontrado, agregando listener...');
        resetBtn.addEventListener('click', (e) => {
            console.log('🖱️ Click en botón Reiniciar');
            e.preventDefault();
            handleResetTokens();
        });
    } else {
        console.warn('⚠️ Botón Reiniciar no encontrado en el DOM');
    }
    
    // Botón pagar apuesta (Admin) - en el header
    const pagarApuestaBtn = document.getElementById('pagarApuestaBtn');
    if (pagarApuestaBtn) {
        console.log('✅ Botón Pagar Apuesta encontrado, agregando listener...');
        pagarApuestaBtn.addEventListener('click', (e) => {
            console.log('🖱️ Click en botón Pagar Apuesta');
            e.preventDefault();
            pagarApuesta();
        });
    } else {
        console.warn('⚠️ Botón Pagar Apuesta no encontrado en el DOM');
    }
    
    // Modal de distribución
    const modal = document.getElementById('distributeModal');
    if (modal) {
        const closeModal = document.querySelector('.close-modal');
        const cancelBtn = document.getElementById('cancelDistributeBtn');
        const processBtn = document.getElementById('processDistributeBtn');
        
        if (closeModal) closeModal.addEventListener('click', closeDistributeModal);
        if (cancelBtn) cancelBtn.addEventListener('click', closeDistributeModal);
        if (processBtn) processBtn.addEventListener('click', handleProcessDistribution);
        
        // Cerrar modal al hacer clic fuera
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeDistributeModal();
            }
        });
    }
    
    // Modal de comprar vidas
    const buyLivesModal = document.getElementById('buyLivesModal');
    if (buyLivesModal) {
        const closeModalBuyLives = buyLivesModal.querySelector('.close-modal');
        const confirmBuyLivesBtn = document.getElementById('confirmBuyLivesBtn');
        const cancelBuyLivesBtn = document.getElementById('cancelBuyLivesBtn');
        const modalLivesInput = document.getElementById('modalLivesInput');
        
        // Event listeners del modal
        if (confirmBuyLivesBtn) {
            confirmBuyLivesBtn.addEventListener('click', handleConfirmBuyLives);
        }
        
        if (cancelBuyLivesBtn) {
            cancelBuyLivesBtn.addEventListener('click', closeBuyLivesModal);
        }
        
        if (closeModalBuyLives) {
            closeModalBuyLives.addEventListener('click', closeBuyLivesModal);
        }
        
        if (modalLivesInput) {
            modalLivesInput.addEventListener('input', updateModalLivesPrice);
        }
        
        // Cerrar modal al hacer clic fuera
        window.addEventListener('click', (event) => {
            if (event.target === buyLivesModal) {
                closeBuyLivesModal();
            }
        });
    }
    
    // Botón distribuir ganancias (apuestas) - en betting results
    const distributeWinningsBtn = document.getElementById('distributeWinningsBtn');
    if (distributeWinningsBtn) {
        distributeWinningsBtn.addEventListener('click', handleDistributeWinnings);
    }
    
    // Inicializar UI
    renderAccounts();
    renderBettingCards();
    updateBankUI().catch(err => console.error('Error actualizando banco:', err));
}

// Funciones del modal de distribución
function openDistributeModal() {
    const modal = document.getElementById('distributeModal');
    if (!modal) {
        console.error('Modal de distribución no encontrado');
        return;
    }
    modal.style.display = 'block';
    const amountInput = document.getElementById('distributeAmount');
    const statusDiv = document.getElementById('distributeStatus');
    if (amountInput) amountInput.value = '';
    if (statusDiv) statusDiv.innerHTML = '';
}

function closeDistributeModal() {
    const modal = document.getElementById('distributeModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function handleProcessDistribution() {
    const amountInput = document.getElementById('distributeAmount');
    const statusDiv = document.getElementById('distributeStatus');
    const processBtn = document.getElementById('processDistributeBtn');
    
    if (!amountInput || !statusDiv || !processBtn) {
        alert('Error: elementos del modal no encontrados');
        return;
    }
    
    const amount = parseFloat(amountInput.value);
    
    if (!amount || amount <= 0) {
        statusDiv.innerHTML = '<span style="color: red;">Por favor ingrese una cantidad válida</span>';
        return;
    }
    
    processBtn.disabled = true;
    statusDiv.innerHTML = '<span style="color: blue;">⏳ Procesando distribución...</span>';
    
    try {
        const result = await distributeTokensFromAdmin(amount);
        
        if (result.success) {
            statusDiv.innerHTML = `<span style="color: green;">✅ ${result.message}</span>`;
            amountInput.value = '';
            
            // Cerrar modal después de 2 segundos
            setTimeout(() => {
                closeDistributeModal();
            }, 2000);
        } else {
            statusDiv.innerHTML = `<span style="color: red;">❌ Error: ${result.message}</span>`;
        }
    } catch (error) {
        statusDiv.innerHTML = `<span style="color: red;">❌ Error: ${error.message}</span>`;
    } finally {
        processBtn.disabled = false;
    }
}

function updateWalletStatus(connected, isLocalNode = false) {
    const statusEl = document.getElementById('walletStatus');
    const btn = document.getElementById('connectWalletBtn');
    const distributeBtn = document.getElementById('distributeBtn');
    const resetBtn = document.getElementById('resetBtn');
    
    if (connected && connectedAccount) {
        const accountShort = `${connectedAccount.substring(0, 6)}...${connectedAccount.substring(38)}`;
        if (isLocalNode) {
            statusEl.textContent = `🖥️ Anvil: ${accountShort}`;
        } else {
            statusEl.textContent = `📱 MetaMask: ${accountShort}`;
        }
        btn.classList.add('connected');
        
        const isAdmin = connectedAccount.toLowerCase() === ADMIN_ADDRESS.toLowerCase();
        
        // Mostrar y habilitar botones solo si es Admin
        if (distributeBtn) {
            if (isAdmin) {
                distributeBtn.style.display = 'inline-block';
                distributeBtn.disabled = false;
                console.log('👑 Botón Distribuir activado y habilitado (Admin)');
            } else {
                distributeBtn.style.display = 'none';
                distributeBtn.disabled = true;
            }
        }
        
        if (resetBtn) {
            if (isAdmin) {
                resetBtn.style.display = 'inline-block';
                resetBtn.disabled = false;
                console.log('👑 Botón Reiniciar activado y habilitado (Admin)');
            } else {
                resetBtn.style.display = 'none';
                resetBtn.disabled = true;
            }
        }
        
        // Actualizar botón Pagar Apuesta (depende de Admin + ganador + bolsa)
        updatePagarApuestaButton();
    } else {
        statusEl.textContent = 'Conectar Wallet';
        btn.classList.remove('connected');
        // Ocultar y deshabilitar botones cuando no hay conexión
        if (distributeBtn) {
            distributeBtn.style.display = 'none';
            distributeBtn.disabled = true;
        }
        if (resetBtn) {
            resetBtn.style.display = 'none';
            resetBtn.disabled = true;
        }
        // Ocultar botón Pagar Apuesta cuando no hay conexión
        updatePagarApuestaButton();
    }
}

function renderAccounts() {
    const accountsList = document.getElementById('accountsList');
    accountsList.innerHTML = '';
    
    // Excluir Admin de la lista (Admin es el banco, no es un jugador)
    for (const [role, account] of Object.entries(ACCOUNTS)) {
        if (role === 'Admin') continue; // Saltar Admin
        const accountEl = document.createElement('div');
        accountEl.className = 'account-item';
        accountEl.id = `account-${account.address}`;
        if (activePlayerAccount === account.address) {
            accountEl.classList.add('active');
        }
        
        accountEl.innerHTML = `
            <div class="account-header">
                <span class="account-name">${role} (${account.name})</span>
                <button class="select-btn ${activePlayerAccount === account.address ? 'active' : ''}" 
                        onclick="selectActivePlayer('${account.address}')">
                    ${activePlayerAccount === account.address ? 'Activo' : 'Seleccionar'}
                </button>
            </div>
            <div class="account-balance">
                Balance: <span class="tokens" id="balance-${account.address}">0</span> tokens
            </div>
        `;
        
        accountsList.appendChild(accountEl);
    }
}

function selectActivePlayer(address) {
    console.log('🎮 Seleccionando jugador activo:', address);
    activePlayerAccount = address;
    const accountInfo = Object.values(ACCOUNTS).find(acc => acc.address === address);
    
    if (accountInfo) {
        console.log('✅ Jugador activo establecido:', accountInfo.role);
        document.getElementById('activePlayerName').textContent = accountInfo.role;
        renderAccounts();
        updateBettingCards();
        
        // Limpiar solo el ganador cuando se cambia el jugador activo
        // NO limpiar currentBets, proposedScores ni stakedPotAmount para mantener las apuestas acumuladas
        currentWinner = null;
        updatePagarApuestaButton();
        
        // Ocultar resultados anteriores
        document.getElementById('bettingResults').style.display = 'none';
        
        // Abrir modal de comprar vidas
        openBuyLivesModal(accountInfo);
        
        // Notificar al juego
        if (window.gameInstance) {
            window.gameInstance.setActivePlayer(address);
        }
    } else {
        console.error('❌ Cuenta no encontrada:', address);
    }
}

function updateAccountBalancesUI() {
    for (const [role, account] of Object.entries(ACCOUNTS)) {
        const balanceEl = document.getElementById(`balance-${account.address}`);
        if (balanceEl) {
            balanceEl.textContent = accountBalances[account.address] || 0;
        }
    }
}

function updateStakedPotUI() {
    const stakedPotEl = document.getElementById('stakedPot');
    if (stakedPotEl) {
        stakedPotEl.textContent = stakedPotAmount || 0;
    }
}

async function updateBankUI() {
    try {
        // Actualizar Tokens Totales con el balance actual de Admin (banco)
        const adminBalance = await getTokenBalance(ADMIN_ADDRESS);
        const totalTokensEl = document.getElementById('totalTokens');
        if (totalTokensEl) {
            totalTokensEl.textContent = adminBalance || 0;
        }
        
        // Actualizar Tokens Vendidos (si se mantiene un registro, sino mostrar 0)
        const soldTokensEl = document.getElementById('soldTokens');
        if (soldTokensEl) {
            soldTokensEl.textContent = soldTokens || 0;
        }
        
        // Calcular Tokens Comprados: balance inicial - balance actual
        // Si no hay balance inicial guardado, calcularlo como la diferencia con totalSupply
        let calculatedBought = 0;
        if (initialBankBalance > 0) {
            calculatedBought = initialBankBalance - adminBalance;
        } else if (contract) {
            try {
                const totalSupply = await contract.totalSupply();
                const supplyNum = parseFloat(totalSupply.toString());
                // Asumir que el balance inicial del banco era el totalSupply
                calculatedBought = Math.max(0, supplyNum - adminBalance);
            } catch (error) {
                console.warn('⚠️ No se pudo calcular tokens comprados:', error);
                // Si falla, calcular con balance inicial si está disponible
                if (initialBankBalance > 0) {
                    calculatedBought = Math.max(0, initialBankBalance - adminBalance);
                }
            }
        }
        
        const boughtTokensEl = document.getElementById('boughtTokens');
        if (boughtTokensEl) {
            boughtTokensEl.textContent = Math.max(0, calculatedBought);
        }
    } catch (error) {
        console.error('❌ Error al actualizar UI del banco:', error);
        // Mostrar valores por defecto en caso de error
        const totalTokensEl = document.getElementById('totalTokens');
        if (totalTokensEl) totalTokensEl.textContent = '0';
        const soldTokensEl = document.getElementById('soldTokens');
        if (soldTokensEl) soldTokensEl.textContent = soldTokens || 0;
        const boughtTokensEl = document.getElementById('boughtTokens');
        if (boughtTokensEl) boughtTokensEl.textContent = '0';
    }
}

// Funciones del modal de comprar vidas
function openBuyLivesModal(accountInfo) {
    const modal = document.getElementById('buyLivesModal');
    if (!modal) {
        console.error('Modal de comprar vidas no encontrado');
        return;
    }
    
    // Establecer información del jugador
    document.getElementById('modalPlayerName').textContent = `Jugador: ${accountInfo.role}`;
    
    // Resetear el input
    const livesInput = document.getElementById('modalLivesInput');
    if (livesInput) {
        livesInput.value = '1';
    }
    
    // Actualizar precio
    updateModalLivesPrice();
    
    // Limpiar estado
    const statusDiv = document.getElementById('modalBuyLivesStatus');
    if (statusDiv) {
        statusDiv.innerHTML = '';
    }
    
    // Mostrar modal
    modal.style.display = 'block';
}

function closeBuyLivesModal() {
    const modal = document.getElementById('buyLivesModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function updateModalLivesPrice() {
    const livesInput = document.getElementById('modalLivesInput');
    const priceEl = document.getElementById('modalLivesPrice');
    
    if (livesInput && priceEl) {
        const livesCount = parseInt(livesInput.value) || 1;
        const price = livesCount * PRICE_PER_LIFE;
        priceEl.textContent = price;
    }
}

async function handleConfirmBuyLives() {
    if (!activePlayerAccount) {
        alert('No hay jugador activo');
        return;
    }
    
    const livesInput = document.getElementById('modalLivesInput');
    const confirmBtn = document.getElementById('confirmBuyLivesBtn');
    const statusDiv = document.getElementById('modalBuyLivesStatus');
    
    if (!livesInput || !confirmBtn || !statusDiv) {
        alert('Error: elementos del modal no encontrados');
        return;
    }
    
    const livesCount = parseInt(livesInput.value) || 1;
    
    if (livesCount < 1) {
        statusDiv.innerHTML = '<span style="color: red;">Debes comprar al menos 1 vida</span>';
        return;
    }
    
    if (livesCount > 6) {
        statusDiv.innerHTML = '<span style="color: red;">Máximo 6 vidas</span>';
        return;
    }
    
    confirmBtn.disabled = true;
    statusDiv.innerHTML = '<span style="color: blue;">⏳ Comprando vidas...</span>';
    
    try {
        const success = await buyLives(activePlayerAccount, livesCount);
        
        if (success) {
            statusDiv.innerHTML = `<span style="color: green;">✅ Comprado exitosamente!</span>`;
            
            // Cerrar modal después de 1 segundo e iniciar el juego
            setTimeout(() => {
                closeBuyLivesModal();
                
                // Iniciar el juego
                if (typeof startGame === 'function') {
                    startGame();
                    console.log('🎮 Juego iniciado');
                }
            }, 1000);
        } else {
            statusDiv.innerHTML = '<span style="color: red;">❌ Error al comprar vidas</span>';
        }
    } catch (error) {
        console.error('Error comprando vidas:', error);
        statusDiv.innerHTML = `<span style="color: red;">❌ Error: ${error.message}</span>`;
    } finally {
        confirmBtn.disabled = false;
    }
}

function renderBettingCards() {
    const bettingCards = document.getElementById('bettingCards');
    bettingCards.innerHTML = '';
    
    for (const [role, account] of Object.entries(ACCOUNTS)) {
        if (account.role === 'Admin') continue; // El admin no apuesta
        
        const card = document.createElement('div');
        card.className = 'betting-card';
        const balance = accountBalances[account.address] || 0;
        const currentBet = currentBets[account.address] || 0;
        
        card.innerHTML = `
            <h4>${role} (${account.name})</h4>
            <div class="betting-card-info">
                Balance: <span class="tokens">${balance}</span> tokens
                ${currentBet > 0 ? `<br>Apuesta actual: <span class="tokens">${currentBet}</span> tokens` : ''}
            </div>
            <div class="betting-input-group">
                <input type="number" 
                       id="proposedScore-${account.address}" 
                       min="0" 
                       step="1"
                       placeholder="Puntaje Propuesto"
                       value="${proposedScores[account.address] || ''}"
                       ${proposedScores[account.address] ? 'disabled' : ''}>
                <input type="number" 
                       id="bet-${account.address}" 
                       min="1" 
                       step="1"
                       placeholder="Cantidad a apostar"
                       value="">
                <button onclick="handlePlaceBet('${account.address}')" 
                        ${activePlayerAccount === account.address ? 'disabled' : ''}>
                    ${currentBet > 0 ? 'Aumentar Apuesta' : 'Apostar'}
                </button>
            </div>
        `;
        
        bettingCards.appendChild(card);
    }
}

function validateBetInput(address) {
    const input = document.getElementById(`bet-${address}`);
    const balance = accountBalances[address] || 0;
    const value = parseInt(input.value) || 0;
    
    if (value > balance) {
        input.value = balance;
        alert('No puedes apostar más de tu balance');
    }
    if (value < 1 && value > 0) {
        input.value = 1;
    }
}

async function handlePlaceBet(address) {
    // Validación opcional: si hay un jugador activo, no puede apostar sobre su propio juego
    if (activePlayerAccount && activePlayerAccount === address) {
        alert('No puedes apostar sobre tu propio juego');
        return;
    }
    
    // Validar que el puntaje propuesto esté lleno
    const proposedScoreInput = document.getElementById(`proposedScore-${address}`);
    if (!proposedScoreInput) {
        console.error('Input de puntaje propuesto no encontrado para dirección:', address);
        return;
    }
    
    const proposedScore = parseInt(proposedScoreInput.value) || 0;
    if (proposedScore < 1) {
        alert('Debes ingresar un puntaje propuesto válido (mayor a 0) antes de apostar.');
        proposedScoreInput.focus();
        return;
    }
    
    const input = document.getElementById(`bet-${address}`);
    if (!input) {
        console.error('Input no encontrado para dirección:', address);
        return;
    }
    
    const betAmount = parseInt(input.value) || 0;
    
    if (betAmount < 1) {
        alert('Debes apostar al menos 1 token. Por favor ingresa una cantidad válida.');
        input.focus();
        return;
    }
    
    const balance = accountBalances[address] || 0;
    if (balance < betAmount) {
        alert(`No tienes suficientes tokens. Balance disponible: ${balance}, Intento de apuesta: ${betAmount}`);
        input.focus();
        return;
    }
    
    // Guardar el puntaje propuesto antes de hacer la apuesta
    proposedScores[address] = proposedScore;
    
    // Deshabilitar el campo de puntaje propuesto
    proposedScoreInput.disabled = true;
    
    const success = await placeBet(address, betAmount);
    if (success) {
        alert(`✅ Apuesta de ${betAmount} tokens realizada exitosamente con puntaje propuesto: ${proposedScore}`);
        input.value = '';
        updateBettingCards();
    } else {
        // Si la apuesta falla, permitir modificar el puntaje propuesto de nuevo
        proposedScoreInput.disabled = false;
        delete proposedScores[address];
        alert('❌ Error al realizar la apuesta. Por favor intenta nuevamente.');
    }
}

function updateBettingCards() {
    // Recalcular bolsa apostada desde currentBets para mantener sincronización
    stakedPotAmount = 0;
    for (const address in currentBets) {
        stakedPotAmount += currentBets[address];
    }
    updateStakedPotUI();
    renderBettingCards();
}

// Función para calcular ganador de apuestas (se llama cuando termina el juego)
function calculateBettingWinner(playerScore) {
    // Recopilar apuestas y calcular diferencias
    let winner = null;
    let minDifference = Infinity;
    let totalPot = 0;
    
    // Calcular el bote total y actualizar stakedPotAmount
    for (const address in currentBets) {
        totalPot += currentBets[address];
    }
    
    // Asegurar que stakedPotAmount esté sincronizado
    stakedPotAmount = totalPot;
    updateStakedPotUI();
    
    if (totalPot === 0) {
        currentWinner = null;
        updatePagarApuestaButton();
        return null; // No hay apuestas
    }
    
    // Encontrar el apostador más cercano al puntaje objetivo usando los puntajes propuestos
    for (const [role, account] of Object.entries(ACCOUNTS)) {
        if (account.role === 'Admin') continue; // Saltar Admin
        
        const betAmount = currentBets[account.address] || 0;
        if (betAmount === 0) continue;
        
        // Usar el puntaje propuesto ingresado por el jugador
        const proposedScore = proposedScores[account.address];
        if (!proposedScore || proposedScore <= 0) continue; // Si no tiene puntaje propuesto válido, saltarlo
        
        const difference = Math.abs(playerScore - proposedScore);
        
        if (difference < minDifference) {
            minDifference = difference;
            winner = {
                address: account.address,
                role: role,
                difference: difference,
                betAmount: betAmount,
                proposedScore: proposedScore,
                totalPot: totalPot
            };
        }
    }
    
    // Almacenar el ganador para que el botón pueda usarlo
    currentWinner = winner;
    updatePagarApuestaButton();
    
    console.log('🏆 Ganador calculado:', winner ? winner.role : 'Ninguno', 'Bolsa apostada:', stakedPotAmount);
    
    return winner;
}

// Función para pagar apuesta (transferir desde Admin al ganador)
async function pagarApuesta() {
    console.log('🎁 pagarApuesta llamado');
    
    if (!currentWinner || !currentWinner.address) {
        alert('No hay ganador para pagar la apuesta');
        return;
    }
    
    if (!contract || !signer) {
        alert('Contrato o signer no disponible. Por favor conecta tu wallet.');
        return;
    }
    
    // Verificar que la cuenta conectada sea Admin
    const connectedAddress = (await signer.getAddress()).toLowerCase();
    if (connectedAddress !== ADMIN_ADDRESS.toLowerCase()) {
        alert('Solo el Admin puede pagar la apuesta');
        return;
    }
    
    const winnerAddress = currentWinner.address;
    const totalPot = stakedPotAmount || currentWinner.totalPot || 0;
    
    if (totalPot <= 0) {
        alert('No hay tokens en la bolsa apostada para pagar');
        return;
    }
    
    try {
        console.log(`💸 Transfiriendo ${totalPot} tokens desde Admin (${ADMIN_ADDRESS}) al ganador ${currentWinner.role} (${winnerAddress})...`);
        
        // Verificar balance del Admin desde el contrato
        const adminBalance = await contract.balanceOf(ADMIN_ADDRESS);
        const adminBalanceNum = parseFloat(adminBalance.toString());
        console.log(`💰 Balance del Admin en contrato: ${adminBalanceNum}`);
        
        // Verificar que el Admin tenga suficientes tokens
        const totalPotWei = ethers.BigNumber.from(totalPot.toString());
        if (adminBalance.lt(totalPotWei)) {
            alert(`El banco no tiene suficientes tokens. Balance: ${adminBalanceNum}, Intento de transferencia: ${totalPot}`);
            return;
        }
        
        // Hacer transferencia real desde Admin al ganador
        const contractWithSigner = contract.connect(signer);
        
        // Estimar gas para la transferencia
        let gasEstimate;
        try {
            gasEstimate = await contractWithSigner.estimateGas.transfer(winnerAddress, totalPotWei);
            console.log(`⛽ Gas estimado: ${gasEstimate.toString()}`);
        } catch (gasError) {
            console.error('❌ Error al estimar gas:', gasError);
            throw gasError;
        }
        
        // Hacer la transferencia
        const tx = await contractWithSigner.transfer(winnerAddress, totalPotWei, {
            gasLimit: gasEstimate.mul(120).div(100) // Aumentar 20% por seguridad
        });
        
        console.log(`⏳ Transacción enviada:`, tx.hash);
        
        // Esperar confirmación
        const receipt = await tx.wait();
        
        if (receipt.status !== 1) {
            throw new Error('Transacción revertida');
        }
        
        console.log(`✅ Transferencia confirmada, block:`, receipt.blockNumber);
        
        // Recargar balances desde blockchain para asegurar consistencia
        await loadAccountBalances();
        
        // Actualizar UI
        updateAccountBalancesUI();
        updateBankUI();
        
        alert(`✅ ${totalPot} tokens pagados exitosamente al ganador ${currentWinner.role}`);
        
        // Limpiar apuestas y puntajes propuestos
        currentBets = {};
        proposedScores = {};
        stakedPotAmount = 0;
        currentWinner = null;
        updateStakedPotUI();
        updateBettingCards();
        updatePagarApuestaButton();
        
    } catch (error) {
        console.error('❌ Error al pagar apuesta:', error);
        alert(`Error al pagar apuesta: ${error.message || error.reason || 'Error desconocido'}`);
    }
}

// Función para actualizar el estado del botón Pagar Apuesta
function updatePagarApuestaButton() {
    const pagarBtn = document.getElementById('pagarApuestaBtn');
    if (!pagarBtn) return;
    
    const isAdmin = connectedAccount && connectedAccount.toLowerCase() === ADMIN_ADDRESS.toLowerCase();
    
    if (isAdmin) {
        pagarBtn.style.display = 'inline-block';
        pagarBtn.disabled = false;
        console.log('👑 Botón Pagar Apuesta habilitado (Admin conectado)');
    } else {
        pagarBtn.style.display = 'none';
        pagarBtn.disabled = true;
    }
}

async function handleDistributeWinnings() {
    const resultsContent = document.getElementById('resultsContent');
    const winnerInfo = resultsContent.querySelector('.result-item.winner');
    
    if (!winnerInfo) {
        alert('No hay ganador para distribuir');
        return;
    }
    
    // Extraer información del ganador del DOM o del estado
    const winnerText = winnerInfo.innerHTML;
    const winnerMatch = winnerText.match(/Ganador: ([\w\s]+)/);
    
    if (!winnerMatch) {
        alert('Error al obtener información del ganador');
        return;
    }
    
    const winnerRole = winnerMatch[1].trim();
    const winnerAccount = Object.values(ACCOUNTS).find(acc => acc.role === winnerRole);
    
    if (!winnerAccount) {
        alert('Cuenta ganadora no encontrada');
        return;
    }
    
    // Calcular bote total
    let totalPot = 0;
    for (const address in currentBets) {
        totalPot += currentBets[address];
    }
    
    if (totalPot === 0) {
        alert('No hay tokens para distribuir');
        return;
    }
    
    const success = await distributeWinnings(winnerAccount.address, totalPot);
    
    if (success) {
        alert(`Se distribuyeron ${totalPot} tokens a ${winnerRole}`);
        
        // Limpiar apuestas y puntajes propuestos
        currentBets = {};
        proposedScores = {};
        stakedPotAmount = 0;
        updateStakedPotUI();
        
        // Actualizar UI
        updateAccountBalancesUI();
        updateBettingCards();
        
        // Ocultar resultados
        document.getElementById('bettingResults').style.display = 'none';
        
        // Deshabilitar botón
        const distributeWinningsBtn = document.getElementById('distributeWinningsBtn');
        if (distributeWinningsBtn) {
            distributeWinningsBtn.disabled = true;
        }
    }
}

// Exportar funciones para uso global
window.blockchainModule = {
    connectWallet,
    selectActivePlayer,
    handlePlaceBet,
    validateBetInput,
    setContractInfo,
    getTokenBalance,
    buyTokens,
    buyLives,
    placeBet,
    distributeWinnings,
    pagarApuesta,
    distributeTokensFromAdmin,
    calculateBettingWinner,
    updatePagarApuestaButton,
    testContractConnection,
    testLocalNodeConnection,
    ACCOUNTS,
    CONTRACT_ADDRESS
};

