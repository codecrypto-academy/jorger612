export const permissionsTreeBodySchema = {
  type: 'object',
  required: ['address', 'login'],
  properties: {
    address: {
      type: 'string',
      pattern: '^0x[a-fA-F0-9]{40}$',
      description: 'Dirección de wallet (0x + 40 hex)',
    },
    login: {
      type: 'string',
      minLength: 1,
      description: 'Login del usuario',
    },
  },
};

export const permissionsTreeResponseSchema = {
  200: {
    type: 'object',
    properties: {
      usuario: {
        type: 'object',
        properties: { id: { type: 'number' }, login: { type: 'string' }, nombre: { type: 'string' } },
      },
      rol: { type: 'object', properties: { id: { type: 'number' }, nombre: { type: 'string' } } },
      menu: {
        type: 'array',
        items: {
          type: 'object',
          properties: { id: { type: 'string' }, label: { type: 'string' }, allowed: { type: 'boolean' } },
        },
      },
    },
  },
  401: {
    type: 'object',
    properties: { error: { type: 'number' }, message: { type: 'string' } },
  },
  403: {
    type: 'object',
    properties: { error: { type: 'number' }, message: { type: 'string' } },
  },
  404: {
    type: 'object',
    properties: { error: { type: 'number' }, message: { type: 'string' } },
  },
};
