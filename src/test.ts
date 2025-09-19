import { ContractService } from './contractService';

/**
 * Script de pruebas para el contrato Storage
 */
async function runTests() {
  console.log('🧪 Ejecutando pruebas del contrato Storage...\n');

  const contractService = new ContractService();

  try {
    // Test 1: Verificar conexión
    console.log('Test 1: Verificando conexión...');
    const isConnected = await contractService.checkConnection();
    if (!isConnected) {
      throw new Error('No se pudo conectar a la red');
    }
    console.log('✅ Test 1 pasado: Conexión exitosa\n');

    // Test 2: Recuperar número inicial
    console.log('Test 2: Recuperando número inicial...');
    const initialNumber = await contractService.retrieveNumber();
    console.log(`✅ Test 2 pasado: Número inicial = ${initialNumber}\n`);

    // Test 3: Almacenar número específico
    console.log('Test 3: Almacenando número 42...');
    await contractService.storeNumber(42);
    console.log('✅ Test 3 pasado: Número 42 almacenado\n');

    // Test 4: Verificar que se almacenó correctamente
    console.log('Test 4: Verificando almacenamiento...');
    const retrievedNumber = await contractService.retrieveNumber();
    if (retrievedNumber !== 42) {
      throw new Error(`Número esperado: 42, obtenido: ${retrievedNumber}`);
    }
    console.log('✅ Test 4 pasado: Número verificado correctamente\n');

    // Test 5: Almacenar otro número
    console.log('Test 5: Almacenando número 999...');
    await contractService.storeNumber(999);
    console.log('✅ Test 5 pasado: Número 999 almacenado\n');

    // Test 6: Verificar el nuevo número
    console.log('Test 6: Verificando nuevo número...');
    const finalNumber = await contractService.retrieveNumber();
    if (finalNumber !== 999) {
      throw new Error(`Número esperado: 999, obtenido: ${finalNumber}`);
    }
    console.log('✅ Test 6 pasado: Nuevo número verificado correctamente\n');

    console.log('🎉 ¡Todas las pruebas pasaron exitosamente!');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
    process.exit(1);
  }
}

// Ejecutar las pruebas
if (require.main === module) {
  runTests().catch(console.error);
}
