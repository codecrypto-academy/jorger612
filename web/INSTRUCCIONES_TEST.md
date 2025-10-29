# Instrucciones para Ejecutar Tests - Supply Chain Tracker

## 📋 Requisitos Previos

Antes de ejecutar los tests, asegúrate de tener instaladas todas las dependencias:

```bash
npm install
```

## 🧪 Ejecutar Tests

### Opción 1: Ejecutar Todos los Tests

Para ejecutar todos los tests del proyecto:

```bash
npm test
```

Este comando ejecutará todos los archivos de test encontrados en el proyecto y mostrará un resumen de los resultados.

### Opción 2: Ejecutar Tests en Modo Watch

Para ejecutar tests en modo watch (se re-ejecutan automáticamente cuando cambias archivos):

```bash
npm test -- --watch
```

### Opción 3: Ejecutar Tests Específicos

Para ejecutar tests de un archivo o directorio específico:

```bash
# Ejecutar tests de un archivo específico
npm test contract.test.ts

# Ejecutar tests de un directorio específico
npm test -- app/lib/__tests__/blockchain.test.ts

# Ejecutar tests que coincidan con un patrón
npm test -- -t "Blockchain Configuration"
```

### Opción 4: Ejecutar Tests con Cobertura

Para ver el reporte de cobertura de código:

```bash
npm test -- --coverage
```

Esto generará un reporte mostrando qué porcentaje del código está cubierto por tests.

## 📁 Estructura de Tests

Los tests están organizados de la siguiente manera:

```
app/
├── lib/
│   └── __tests__/
│       ├── blockchain.test.ts      # Tests del servicio Blockchain
│       └── contract.test.ts       # Tests del servicio Contract
├── components/
│   └── __tests__/
│       ├── Store.test.tsx          # Tests del componente Store
│       ├── RegistrationStatus.test.tsx  # Tests de estado de registro
│       └── MyTokens.test.tsx       # Tests del componente MyTokens
└── hooks/
    └── __tests__/
        └── useWallet.test.ts       # Tests del hook useWallet
```

## ✅ Tests Incluidos

### 1. Tests de BlockchainService (`blockchain.test.ts`)
- ✅ Configuración de redes (Localhost, Sepolia)
- ✅ Instanciación del servicio
- ✅ Verificación de configuración de red

**Estado**: ✅ Todos los tests pasan

### 2. Tests de ContractService (`contract.test.ts`)
- ✅ Inicialización del servicio
- ✅ Manejo de errores cuando MetaMask no está instalado
- ✅ Obtención de información de usuario
- ✅ Verificación de administrador
- ✅ Obtención de balance de tokens

**Nota**: Estos tests usan mocks para simular interacciones con blockchain

### 3. Tests de Componentes
- ✅ **Store.test.tsx**: Renderizado básico, estados de carga
- ✅ **RegistrationStatus.test.tsx**: Estados de éxito/error, interacciones
- ✅ **MyTokens.test.tsx**: Renderizado básico

**Nota**: Los tests de componentes requieren mocks de contextos y servicios

### 4. Tests de Hooks
- ✅ **useWallet.test.ts**: Estructura básica del hook

**Nota**: Tests básicos de estructura - pueden requerir ajustes según implementación

## 🔧 Configuración

Los tests están configurados usando:
- **Jest**: Framework de testing
- **@testing-library/react**: Utilidades para testing de componentes React
- **jest-environment-jsdom**: Entorno para testing de DOM

La configuración se encuentra en:
- `jest.config.js`: Configuración principal de Jest
- `jest.setup.js`: Configuración global para tests

## 📊 Interpretación de Resultados

### Ejecución Exitosa
```
PASS  app/lib/__tests__/blockchain.test.ts
  Blockchain Configuration
    ✓ Sepolia network should be configured correctly
    ✓ Localhost network should be configured correctly
    ✓ BlockchainService should be instantiable

Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
```

### Ejecución con Errores
Si algún test falla, verás un mensaje detallado indicando:
- Qué test falló
- Por qué falló
- Dónde ocurrió el error

## 🐛 Solución de Problemas

### Error: "Cannot find module"
Si recibes errores de módulos no encontrados, asegúrate de que todas las dependencias estén instaladas:

```bash
npm install
```

### Error: "Test environment is not configured"
Verifica que `jest.config.js` y `jest.setup.js` estén presentes en la raíz del proyecto.

### Tests que fallan por mocks
Algunos tests usan mocks para simular llamadas a blockchain. Si fallan, revisa:
1. Que los mocks estén correctamente configurados
2. Que las funciones mockadas retornen los valores esperados

### Limpiar caché de Jest
Si tienes problemas con tests que deberían pasar pero fallan:

```bash
npm test -- --clearCache
```

## 🎯 Agregar Nuevos Tests

Para agregar nuevos tests:

1. Crea un archivo con extensión `.test.ts` o `.test.tsx` en el directorio correspondiente
2. Sigue la estructura de los tests existentes
3. Ejecuta los tests para verificar que todo funciona

### Ejemplo de Estructura de Test

```typescript
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  test('should render correctly', () => {
    // Tu test aquí
  });
});
```

## 📝 Mejores Prácticas

1. **Un test por funcionalidad**: Cada test debe verificar una funcionalidad específica
2. **Nombres descriptivos**: Los nombres de los tests deben describir claramente qué están probando
3. **Tests independientes**: Los tests no deben depender unos de otros
4. **Mocks apropiados**: Usa mocks para aislar la funcionalidad que estás probando
5. **Limpieza**: Limpia mocks y estado después de cada test

## 🔍 Comandos Útiles

```bash
# Ejecutar tests en modo verbose (más detalles)
npm test -- --verbose

# Ejecutar tests y actualizar snapshots (si usas snapshots)
npm test -- --updateSnapshot

# Ejecutar tests filtrados por nombre
npm test -- -t "ContractService"

# Ejecutar tests y generar reporte HTML de cobertura
npm test -- --coverage --coverageReporters=html
```

## 📚 Recursos Adicionales

- [Documentación de Jest](https://jestjs.io/docs/getting-started)
- [Testing Library para React](https://testing-library.com/react)
- [Documentación de Next.js Testing](https://nextjs.org/docs/pages/building-your-application/optimizing/testing)

## ✅ Checklist de Ejecución

Antes de ejecutar tests, verifica:

- [ ] Dependencias instaladas (`npm install`)
- [ ] Archivos de configuración presentes (`jest.config.js`, `jest.setup.js`)
- [ ] Variables de entorno configuradas si son necesarias
- [ ] No hay procesos bloqueando puertos necesarios

---

**Última actualización**: Diciembre 2024  
**Versión de Jest**: 30.2.0  
**Entorno de testing**: jsdom
