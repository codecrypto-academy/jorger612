/**
 * Mock de window.ethereum que redirige todas las llamadas JSON-RPC
 * al nodo Anvil local, simulando el comportamiento de MetaMask.
 *
 * - eth_requestAccounts / eth_accounts → cuenta owner esperada en e2e (debe coincidir con contract.owner())
 * - eth_chainId / net_version          → Chain 31337
 * - eth_sendTransaction                → Anvil firma con cuenta desbloqueada
 * - Todo lo demás                      → forward directo a Anvil
 */

export const OWNER_ADDRESS = process.env.CONTRACT_OWNER_ADDRESS || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
export const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '';
export const RPC_URL = process.env.RPC_URL || 'http://localhost:8545';
export const CHAIN_ID_HEX = process.env.CHAIN_ID_HEX || '0x7a69'; // 31337
export const CHAIN_ID_DEC = process.env.CHAIN_ID || '31337';

/**
 * Script que se inyecta en el browser ANTES de que cargue la página.
 * Define window.ethereum como un proveedor compatible con EIP-1193.
 */
export const MOCK_ETHEREUM_SCRIPT = `
(function() {
  const OWNER    = '${OWNER_ADDRESS}';
  const RPC      = '${RPC_URL}';
  const CHAIN_ID = '${CHAIN_ID_HEX}';

  let _id = 1;

  async function rpcCall(method, params) {
    const res = await fetch(RPC, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ jsonrpc: '2.0', id: _id++, method, params: params || [] }),
    });
    const json = await res.json();
    if (json.error) {
      const err = new Error(json.error.message);
      err.code = json.error.code;
      err.data = json.error.data;
      throw err;
    }
    return json.result;
  }

  window.ethereum = {
    isMetaMask:      true,
    selectedAddress: OWNER,

    async request({ method, params }) {
      // Métodos interceptados localmente
      if (method === 'eth_requestAccounts')        return [OWNER];
      if (method === 'eth_accounts')               return [OWNER];
      if (method === 'eth_chainId')                return CHAIN_ID;
      if (method === 'net_version')                return '${CHAIN_ID_DEC}';
      if (method === 'wallet_switchEthereumChain') return null;
      if (method === 'wallet_addEthereumChain')    return null;

      // eth_sendTransaction: Anvil firma con cuenta desbloqueada
      if (method === 'eth_sendTransaction') {
        const tx = (params || [])[0] || {};
        if (!tx.from) tx.from = OWNER;
        return rpcCall('eth_sendTransaction', [tx]);
      }

      // Todo lo demás se delega al nodo
      return rpcCall(method, params);
    },

    // Stubs de eventos — en tests no se cambia cuenta ni red
    on:             function() {},
    once:           function() {},
    removeListener: function() {},
    removeAllListeners: function() {},
  };

  console.log('[MockEthereum] window.ethereum inyectado — owner:', OWNER);
})();
`;
