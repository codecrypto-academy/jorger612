import { ObjectId } from 'mongodb';
import { ethers } from 'ethers';
import { getMarketLeadsCollection } from '../db/mongo.js';
import { assertContractOwner } from '../utils/ownerAuth.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const STATUS_PENDIENTE = 'Pendiente';
const STATUS_ENVIADO = 'Enviado';
const STATUS_ANULADO = 'Anulado';

function badRequest(reply, message) {
  return reply.code(400).send({ error: 'bad_request', message });
}

function forbidden(reply, message) {
  return reply.code(403).send({ error: 'forbidden', message });
}

/**
 * POST /market/leads
 * Body: { walletAddress, nombreApellido?, email, telefono?, descripcionAplicacion? }
 * No almacena "confirmar correo" (solo validación en front).
 */
export async function createMarketLead(request, reply) {
  const body = request.body ?? {};
  const walletAddress = typeof body.walletAddress === 'string' ? body.walletAddress.trim() : '';
  const nombreApellido = typeof body.nombreApellido === 'string' ? body.nombreApellido.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const telefono = typeof body.telefono === 'string' ? body.telefono.trim() : '';
  const descripcionAplicacion = typeof body.descripcionAplicacion === 'string' ? body.descripcionAplicacion.trim() : '';

  if (!walletAddress) {
    return badRequest(reply, 'La dirección de wallet es obligatoria.');
  }
  if (!ethers.isAddress(walletAddress)) {
    return badRequest(reply, 'La dirección de wallet no es válida.');
  }
  if (!email) {
    return badRequest(reply, 'El correo electrónico es obligatorio.');
  }
  if (!EMAIL_RE.test(email)) {
    return badRequest(reply, 'El correo electrónico no es válido.');
  }
  if (nombreApellido.length > 200) {
    return badRequest(reply, 'Nombre y apellido demasiado largo.');
  }
  if (telefono.length > 40) {
    return badRequest(reply, 'Teléfono demasiado largo.');
  }
  if (descripcionAplicacion.length > 4000) {
    return badRequest(reply, 'Descripción demasiado larga.');
  }

  const doc = {
    walletAddress: ethers.getAddress(walletAddress),
    nombreApellido: nombreApellido || undefined,
    email,
    telefono: telefono || undefined,
    descripcionAplicacion: descripcionAplicacion || undefined,
    status: STATUS_PENDIENTE,
    createdAt: new Date(),
  };

  const col = getMarketLeadsCollection();
  const result = await col.insertOne(doc);

  return reply.code(201).send({
    ok: true,
    id: result.insertedId.toString(),
  });
}

function ownerHeader(request) {
  return request.headers['x-owner-address'] ?? request.headers['X-Owner-Address'];
}

/**
 * GET /market/leads — listado (solo owner). Header: X-Owner-Address
 */
export async function listMarketLeads(request, reply) {
  const raw = ownerHeader(request);
  try {
    await assertContractOwner(raw);
  } catch (err) {
    if (err.code === 'NOT_OWNER') return forbidden(reply, err.message);
    if (err.code === 'MISSING_ADDRESS' || err.code === 'INVALID_ADDRESS') {
      return badRequest(reply, err.message);
    }
    return badRequest(reply, err.message ?? 'No autorizado.');
  }

  const col = getMarketLeadsCollection();
  const rows = await col.find({}).sort({ createdAt: -1 }).toArray();
  const items = rows.map((doc) => ({
    id: doc._id.toString(),
    walletAddress: doc.walletAddress,
    nombreApellido: doc.nombreApellido ?? '',
    email: doc.email,
    telefono: doc.telefono ?? '',
    descripcionAplicacion: doc.descripcionAplicacion ?? '',
    status: doc.status ?? STATUS_PENDIENTE,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt,
  }));

  return reply.send({ items });
}

/**
 * PATCH /market/leads/:id — actualizar status (solo owner)
 * Body: { ownerAddress, status: "Enviado" | "Anulado" }
 */
export async function updateMarketLeadStatus(request, reply) {
  const { id } = request.params;
  if (!id || !ObjectId.isValid(id)) {
    return badRequest(reply, 'Identificador no válido.');
  }

  const body = request.body ?? {};
  const ownerAddr = typeof body.ownerAddress === 'string' ? body.ownerAddress.trim() : '';
  const status = typeof body.status === 'string' ? body.status.trim() : '';

  try {
    await assertContractOwner(ownerAddr);
  } catch (err) {
    if (err.code === 'NOT_OWNER') return forbidden(reply, err.message);
    if (err.code === 'MISSING_ADDRESS' || err.code === 'INVALID_ADDRESS') {
      return badRequest(reply, err.message);
    }
    return badRequest(reply, err.message ?? 'No autorizado.');
  }

  if (status !== STATUS_ENVIADO && status !== STATUS_ANULADO) {
    return badRequest(reply, 'El estado debe ser "Enviado" o "Anulado".');
  }

  const col = getMarketLeadsCollection();
  const _id = new ObjectId(id);
  const existing = await col.findOne({ _id });
  if (!existing) {
    return reply.code(404).send({ error: 'not_found', message: 'Solicitud no encontrada.' });
  }

  const current = existing.status ?? STATUS_PENDIENTE;
  if (current === STATUS_ANULADO) {
    return badRequest(reply, 'No se puede modificar una solicitud anulada.');
  }
  if (status === STATUS_ENVIADO && current !== STATUS_PENDIENTE) {
    return badRequest(reply, 'Solo se puede marcar como enviado desde estado Pendiente.');
  }

  const result = await col.updateOne(
    { _id },
    { $set: { status, updatedAt: new Date() } },
  );

  if (result.matchedCount === 0) {
    return reply.code(404).send({ error: 'not_found', message: 'Solicitud no encontrada.' });
  }

  return reply.send({ ok: true });
}
