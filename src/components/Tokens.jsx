import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import ABI_TOKEN from '../ABI_TOKEN';
import { loadStripe } from '@stripe/stripe-js';
import HistorialTokens from './HistorialTokens';

const CONTRACT_TOKEN_ADDRESS = '0xf3a330d667328f70EE26444f5519d457cdD36fdf';
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51RyliSR7WYX5Nnc0KKM0l43YlzI6JWZxE5gAEF70aY0Hsroy8y6uHSQEFNA2f8QQVRAcIU7NN';

function Tokens({ provider, account }) {
  const [contractToken, setContractToken] = useState(null);
  const [tokenBalance, setTokenBalance] = useState('0');
  const [euroBalance, setEuroBalance] = useState('0');
  const [tokenPrice, setTokenPrice] = useState('0');
  const [entryFee, setEntryFee] = useState('0');
  const [exitFee, setExitFee] = useState('0');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [activeTab, setActiveTab] = useState('gestion');
  
  // Estados para compra de tokens
  const [eurosToSpend, setEurosToSpend] = useState('');
  const [tokensToReceive, setTokensToReceive] = useState('0');
  
  // Estados para retiro de tokens
  const [tokensToRedeem, setTokensToRedeem] = useState('');
  const [eurosToReceive, setEurosToReceive] = useState('0');
  
  // Estados para Stripe
  const [stripe, setStripe] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Inicializar contrato y Stripe cuando se conecte la wallet
  useEffect(() => {
    if (provider && account) {
      const initContract = async () => {
        try {
          const signer = await provider.getSigner();
          const contractInstance = new ethers.Contract(CONTRACT_TOKEN_ADDRESS, ABI_TOKEN, signer);
          setContractToken(contractInstance);
          await cargarDatosToken(contractInstance);
        } catch (error) {
          console.error('Error inicializando contrato:', error);
        }
      };
      initContract();
    }
  }, [provider, account]);

  // Inicializar Stripe
  useEffect(() => {
    const initStripe = async () => {
      const stripeInstance = await loadStripe(STRIPE_PUBLISHABLE_KEY);
      setStripe(stripeInstance);
    };
    initStripe();
  }, []);

  // Cargar datos del token
  const cargarDatosToken = async (contractInstance = contractToken) => {
    if (!contractInstance) return;
    
    try {
      setLoading(true);
      
      // Obtener balance de tokens del usuario
      const balance = await contractInstance.balanceOf(account);
      setTokenBalance(ethers.formatUnits(balance, 18));
      
      // Obtener balance en euros del usuario
      const euroBal = await contractInstance.getEuroBalance(account);
      setEuroBalance(ethers.formatUnits(euroBal, 18));
      
      // Obtener precio del token
      const price = await contractInstance.tokenPrice();
      setTokenPrice(ethers.formatUnits(price, 18));
      
      // Obtener comisiones
      const entry = await contractInstance.entryFee();
      setEntryFee(ethers.formatUnits(entry, 18));
      
      const exit = await contractInstance.exitFee();
      setExitFee(ethers.formatUnits(exit, 18));
      
    } catch (error) {
      console.error('Error cargando datos del token:', error);
      setStatus({
        type: 'error',
        message: 'Error cargando datos del token: ' + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  // Calcular tokens a recibir al comprar
  const calcularTokensCompra = async (euros) => {
    if (!contractToken || !euros || euros <= 0) {
      setTokensToReceive('0');
      return;
    }
    
    try {
      const eurosWei = ethers.parseUnits(euros.toString(), 18);
      const tokens = await contractToken.purchaseTokens(account, eurosWei);
      setTokensToReceive(ethers.formatUnits(tokens, 18));
    } catch (error) {
      console.error('Error calculando tokens:', error);
      setTokensToReceive('0');
    }
  };

  // Calcular euros a recibir al retirar
  const calcularEurosRetiro = async (tokens) => {
    if (!contractToken || !tokens || tokens <= 0) {
      setEurosToReceive('0');
      return;
    }
    
    try {
      const tokensWei = ethers.parseUnits(tokens.toString(), 18);
      const euros = await contractToken.redeemTokens(account, tokensWei);
      setEurosToReceive(ethers.formatUnits(euros, 18));
    } catch (error) {
      console.error('Error calculando euros:', error);
      setEurosToReceive('0');
    }
  };

  // Manejar cambio en euros a gastar
  const handleEurosChange = (e) => {
    const value = e.target.value;
    setEurosToSpend(value);
    if (value && value > 0) {
      calcularTokensCompra(parseFloat(value));
    } else {
      setTokensToReceive('0');
    }
  };

  // Manejar cambio en tokens a retirar
  const handleTokensChange = (e) => {
    const value = e.target.value;
    setTokensToRedeem(value);
    if (value && value > 0) {
      calcularEurosRetiro(parseFloat(value));
    } else {
      setEurosToReceive('0');
    }
  };

  // Comprar tokens con Stripe
  const comprarTokens = async () => {
    if (!stripe || !eurosToSpend || eurosToSpend <= 0) {
      setStatus({
        type: 'error',
        message: 'Por favor ingresa un monto válido'
      });
      return;
    }

    setProcessingPayment(true);
    setStatus({
      type: 'info',
      message: 'Procesando pago con Stripe...'
    });

    try {
      // Aquí normalmente se haría una llamada al backend para crear el payment intent
      // Por ahora simularemos el proceso
      
      // Simular delay de Stripe
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Después del pago exitoso, llamar al contrato
      const eurosWei = ethers.parseUnits(eurosToSpend.toString(), 18);
      const tx = await contractToken.purchaseTokens(account, eurosWei);
      
      setStatus({
        type: 'info',
        message: 'Transacción enviada! Esperando confirmación...'
      });
      
      await tx.wait();
      
      setStatus({
        type: 'success',
        message: `¡Compra exitosa! Has recibido ${tokensToReceive} tokens EURO`
      });
      
      // Limpiar formulario y recargar datos
      setEurosToSpend('');
      setTokensToReceive('0');
      await cargarDatosToken();
      
    } catch (error) {
      console.error('Error en la compra:', error);
      setStatus({
        type: 'error',
        message: 'Error en la compra: ' + error.message
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  // Retirar tokens
  const retirarTokens = async () => {
    if (!tokensToRedeem || tokensToRedeem <= 0) {
      setStatus({
        type: 'error',
        message: 'Por favor ingresa una cantidad válida de tokens'
      });
      return;
    }

    if (parseFloat(tokensToRedeem) > parseFloat(tokenBalance)) {
      setStatus({
        type: 'error',
        message: 'No tienes suficientes tokens para retirar'
      });
      return;
    }

    setLoading(true);
    setStatus({
      type: 'info',
      message: 'Procesando retiro de tokens...'
    });

    try {
      const tokensWei = ethers.parseUnits(tokensToRedeem.toString(), 18);
      const tx = await contractToken.redeemTokens(account, tokensWei);
      
      setStatus({
        type: 'info',
        message: 'Transacción enviada! Esperando confirmación...'
      });
      
      await tx.wait();
      
      setStatus({
        type: 'success',
        message: `¡Retiro exitoso! Has recibido ${eurosToReceive} EUR`
      });
      
      // Limpiar formulario y recargar datos
      setTokensToRedeem('');
      setEurosToReceive('0');
      await cargarDatosToken();
      
    } catch (error) {
      console.error('Error en el retiro:', error);
      setStatus({
        type: 'error',
        message: 'Error en el retiro: ' + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="card">
        <h2>🪙 Tokens EURO</h2>
        <div className="info-message">
          💡 <strong>Gestiona tus tokens EURO - Stablecoin del sistema</strong>
        </div>
        
        {/* Pestañas internas */}
        <div className="tokens-tabs">
          <button 
            className={`token-tab ${activeTab === 'gestion' ? 'active' : ''}`}
            onClick={() => setActiveTab('gestion')}
          >
            💰 Gestión
          </button>
          <button 
            className={`token-tab ${activeTab === 'historial' ? 'active' : ''}`}
            onClick={() => setActiveTab('historial')}
          >
            📊 Historial
          </button>
        </div>
        
        {/* Contenido de las pestañas */}
        {activeTab === 'gestion' && (
          <>
            {/* Balance del Usuario */}
            <div className="balance-section">
              <h3>💰 Tu Balance</h3>
              <div className="balance-grid">
                <div className="balance-item">
                  <span className="balance-label">Tokens EURO:</span>
                  <span className="balance-value">{tokenBalance} EURO</span>
                </div>
                <div className="balance-item">
                  <span className="balance-label">Valor en EUR:</span>
                  <span className="balance-value">{(parseFloat(tokenBalance) * parseFloat(tokenPrice)).toFixed(2)} EUR</span>
                </div>
                <div className="balance-item">
                  <span className="balance-label">Balance EUR:</span>
                  <span className="balance-value">{euroBalance} EUR</span>
                </div>
              </div>
            </div>

            {/* Información del Token */}
            <div className="token-info-section">
              <h3>📊 Información del Token</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Precio del Token:</span>
                  <span className="info-value">{tokenPrice} EUR</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Comisión de Entrada:</span>
                  <span className="info-value">{entryFee}%</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Comisión de Salida:</span>
                  <span className="info-value">{exitFee}%</span>
                </div>
              </div>
            </div>

            {/* Compra de Tokens */}
            <div className="card">
              <h3>💳 Comprar Tokens EURO</h3>
              <div className="form-group">
                <label htmlFor="eurosToSpend">Euros a gastar (EUR):</label>
                <input
                  type="number"
                  id="eurosToSpend"
                  value={eurosToSpend}
                  onChange={handleEurosChange}
                  placeholder="Ingresa la cantidad en euros"
                  min="0"
                  step="0.01"
                  disabled={processingPayment}
                />
              </div>
              
              {tokensToReceive > 0 && (
                <div className="calculation-result">
                  <p><strong>Recibirás:</strong> {tokensToReceive} tokens EURO</p>
                  <p><strong>Comisión:</strong> {entryFee}%</p>
                </div>
              )}
              
              <button 
                className="btn btn-primary"
                onClick={comprarTokens}
                disabled={!eurosToSpend || eurosToSpend <= 0 || processingPayment || !stripe}
              >
                {processingPayment ? '⏳ Procesando...' : '💳 Comprar con Tarjeta'}
              </button>
              
              {!stripe && (
                <p className="stripe-warning">
                  ⚠️ Stripe no está disponible. Por favor recarga la página.
                </p>
              )}
            </div>

            {/* Retiro de Tokens */}
            <div className="card">
              <h3>💸 Retirar Tokens EURO</h3>
              <div className="form-group">
                <label htmlFor="tokensToRedeem">Tokens a retirar (EURO):</label>
                <input
                  type="number"
                  id="tokensToRedeem"
                  value={tokensToRedeem}
                  onChange={handleTokensChange}
                  placeholder="Ingresa la cantidad de tokens"
                  min="0"
                  step="0.01"
                  max={tokenBalance}
                  disabled={loading}
                />
              </div>
              
              {eurosToReceive > 0 && (
                <div className="calculation-result">
                  <p><strong>Recibirás:</strong> {eurosToReceive} EUR</p>
                  <p><strong>Comisión:</strong> {exitFee}%</p>
                </div>
              )}
              
              <button 
                className="btn btn-secondary"
                onClick={retirarTokens}
                disabled={!tokensToRedeem || tokensToRedeem <= 0 || loading || parseFloat(tokensToRedeem) > parseFloat(tokenBalance)}
              >
                {loading ? '⏳ Procesando...' : '💸 Retirar a EUR'}
              </button>
            </div>

            {/* Botón de Actualización */}
            <div className="update-section">
              <button 
                className="btn btn-secondary"
                onClick={() => cargarDatosToken()}
                disabled={loading}
              >
                🔄 Actualizar Datos
              </button>
            </div>
          </>
        )}
        
        {activeTab === 'historial' && (
          <HistorialTokens provider={provider} account={account} />
        )}

        {/* Estado y Mensajes */}
        {status.message && (
          <div className={`status ${status.type}`}>
            {status.message}
          </div>
        )}
      </div>
    </div>
  );
}

export default Tokens;
