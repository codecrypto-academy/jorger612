rjorgea@LAPTOP-ATPQUCMA:~/dao-main$                                                          
chmod +x deploy-local.sh
rjorgea@LAPTOP-ATPQUCMA:~/dao-main$ ./deploy-local.sh
🚀 DAO Voting Platform - Local Deployment
==========================================

📡 Verificando Anvil...
✓ Anvil corriendo

📝 Deployando contratos...
Creando sc/.env...
Compilando contratos...
Ejecutando deployment...
✓ Contratos deployados
  MinimalForwarder: 0x5FbDB2315678afecb367f032d93F642f64180aa3
  DAOVoting: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512

📋 Generando ABIs...
./deploy-local.sh: line 85: jq: command not found
./deploy-local.sh: line 86: jq: command not found
✓ ABIs generados

⚙️  Configurando web/.env.local...
✓ Configuración completada

📦 Instalando dependencias de npm...

added 406 packages, and audited 413 packages in 6h

168 packages are looking for funding
  run `npm fund` for details

1 moderate severity vulnerability

To address all issues, run:
  npm audit fix

Run `npm audit` for details.
✓ Dependencias instaladas

==========================================
✅ Deployment completado exitosamente
==========================================\033[0m

📝 Información de Deployment:
  MinimalForwarder: 0x5FbDB2315678afecb367f032d93F642f64180aa3
  DAOVoting:       0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
  Relayer:         0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

🚀 Próximos pasos:
  1. Ejecuta: cd web && npm run dev
  2. Abre: http://localhost:3000
  3. Configura MetaMask:
     - Network: Localhost
     - RPC: http://127.0.0.1:8545
     - Chain ID: 31337
  4. Importa una cuenta de Anvil (usa una diferente a la del relayer)

💡 Cuenta de Anvil para importar:
  Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
  Address: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8

rjorgea@LAPTOP-ATPQUCMA:~/dao-main$ 