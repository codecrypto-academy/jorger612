import { ContractService } from './contractService';

/**
 * Función principal para demostrar el uso del servicio del contrato
 */
async function main() {
  console.log('🚀 Iniciando interacción con el contrato Storage...\n');

  // Crear instancia del servicio
  const contractService = new ContractService();

  try {
    // Verificar conexión
    console.log('1. Verificando conexión...');
    const isConnected = await contractService.checkConnection();
    if (!isConnected) {
      console.error('❌ No se pudo conectar a la red local');
      return;
    }
    console.log('✅ Conexión exitosa\n');

    // Obtener información del contrato
    console.log('2. Obteniendo información del contrato...');
    const contractInfo = await contractService.getContractInfo();
    console.log('📋 Información del contrato:');
    console.log(`   - Dirección: ${contractInfo.address}`);
    console.log(`   - Balance del desplegador: ${contractInfo.balance} ETH`);
    console.log(`   - Address del desplegador: ${contractInfo.deployerAddress}\n`);

    // Recuperar el número actual
    console.log('3. Recuperando número actual...');
    const currentNumber = await contractService.retrieveNumber();
    console.log(`📖 Número actual almacenado: ${currentNumber}\n`);

    // Almacenar un nuevo número
    console.log('4. Almacenando nuevo número...');
    const newNumber = Math.floor(Math.random() * 1000) + 1; // Número aleatorio entre 1 y 1000
    const txHash = await contractService.storeNumber(newNumber);
    console.log(`✅ Número ${newNumber} almacenado exitosamente`);
    console.log(`🔗 Hash de la transacción: ${txHash}\n`);

    // Verificar que el número se almacenó correctamente
    console.log('5. Verificando almacenamiento...');
    const storedNumber = await contractService.retrieveNumber();
    console.log(`✅ Número verificado: ${storedNumber}`);
    
    if (storedNumber === newNumber) {
      console.log('🎉 ¡El contrato funciona correctamente!');
    } else {
      console.log('❌ Error: El número almacenado no coincide');
    }

  } catch (error) {
    console.error('❌ Error durante la ejecución:', error);
  }
}

// Ejecutar la función principal
if (require.main === module) {
  main().catch(console.error);
}

export { ContractService };
