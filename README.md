# Gestión de Usuarios - Blockchain

Una aplicación React + Vite para la gestión de usuarios conectada a una red blockchain local (Anvil).

## Características

- ✅ **Crear usuarios**: Agregar nuevos usuarios con nombre y edad
- ✅ **Leer usuarios**: Ver todos los usuarios activos y buscar por ID
- ✅ **Actualizar usuarios**: Modificar información de usuarios existentes
- ✅ **Eliminar usuarios**: Remover usuarios del sistema
- ✅ **Interfaz moderna**: UI responsiva con diseño atractivo
- ✅ **Conexión blockchain**: Integración con contrato inteligente en Anvil

## Requisitos Previos

1. **Node.js** (versión 16 o superior)
2. **Anvil** ejecutándose en `localhost:8545`
3. **Contrato desplegado** en la dirección `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Iniciar el servidor de desarrollo:
```bash
npm run dev
```

3. Abrir la aplicación en `http://localhost:3000`

## Configuración de Anvil

Asegúrate de que Anvil esté ejecutándose con al menos una cuenta:

```bash
anvil --accounts 10
```

## Funcionalidades

### 1. Lista de Usuarios
- Ver todos los usuarios registrados
- Editar usuarios directamente en la tabla
- Eliminar usuarios con confirmación
- Actualizar la lista

### 2. Crear Usuario
- Formulario para agregar nuevos usuarios
- Validación de campos (nombre y edad)
- Confirmación de creación exitosa

### 3. Buscar Usuario
- Buscar usuario específico por ID
- Ver detalles completos del usuario
- Editar o eliminar desde la vista de detalles

## Estructura del Proyecto

```
src/
├── components/
│   ├── UserForm.jsx      # Formulario para crear usuarios
│   ├── UserList.jsx      # Lista de usuarios con acciones
│   └── UserDetails.jsx   # Vista detallada de un usuario
├── services/
│   └── web3Service.js    # Servicio para interacción con blockchain
├── App.jsx               # Componente principal
├── App.css              # Estilos principales
└── main.jsx             # Punto de entrada
```

## Tecnologías Utilizadas

- **React 18** - Framework de UI
- **Vite** - Herramienta de construcción
- **Web3.js** - Interacción con blockchain
- **Lucide React** - Iconos
- **CSS3** - Estilos y animaciones

## Solución de Problemas

### Error de Conexión
Si la aplicación no puede conectarse a Anvil:
1. Verifica que Anvil esté ejecutándose en `localhost:8545`
2. Asegúrate de que el contrato esté desplegado en la dirección correcta
3. Revisa la consola del navegador para más detalles

### Transacciones Fallidas
Si las transacciones fallan:
1. Verifica que tengas suficiente ETH en la cuenta
2. Asegúrate de que el contrato esté correctamente desplegado
3. Revisa los logs de Anvil para errores

## Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Previsualiza la construcción de producción
- `npm run lint` - Ejecuta el linter de ESLint
