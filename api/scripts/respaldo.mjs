#!/usr/bin/env node
/**
 * Genera respaldo.md con datos on-chain (SecurityManager) y leads MongoDB (Market).
 *
 * Uso (desde el directorio api/):
 *   npm run respaldo
 *
 * O:
 *   node --env-file=.env scripts/respaldo.mjs [ruta-salida]
 *
 * Variables en api/.env: RPC_URL, CONTRACT_ADDRESS, CHAIN_ID, CONTRACT_DEPLOY_BLOCK,
 * MONGODB_URI (opcional; si falta, solo se documenta en el markdown).
 *
 * La salida por defecto es ./respaldo.md (relativo al cwd).
 */

import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { MongoClient } from 'mongodb';
import { getContract, ZERO_ADDRESS } from '../src/config/blockchain.js';

function esc(s) {
  return String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

/** @param {import('ethers').Contract} contract */
async function scanRoles(contract) {
  const rows = [];
  for (let id = 1; id < 100_000; id++) {
    const r = await contract.roles(id);
    if (!r.id || Number(r.id) === 0) break;
    rows.push({
      id: Number(r.id),
      nombre: r.nombre,
      activo: r.activo,
      timestamp: r.timestamp?.toString?.() ?? String(r.timestamp),
      ejecutor: r.ejecutor,
    });
  }
  return rows;
}

/** @param {import('ethers').Contract} contract */
async function scanUsuarios(contract) {
  const rows = [];
  for (let id = 1; id < 100_000; id++) {
    const u = await contract.usuarios(id);
    if (!u.id || Number(u.id) === 0) break;
    rows.push({
      id: Number(u.id),
      login: u.login,
      nombre: u.nombre,
      rolId: Number(u.rolId),
      activo: u.activo,
      timestamp: u.timestamp?.toString?.() ?? String(u.timestamp),
      ejecutor: u.ejecutor,
    });
  }
  return rows;
}

/** @param {import('ethers').Contract} contract */
async function scanMenus(contract) {
  const rows = [];
  for (let id = 1; id < 100_000; id++) {
    const m = await contract.menus(id);
    if (!m.id || Number(m.id) === 0) break;
    rows.push({
      id: Number(m.id),
      nombre: m.nombre,
      activo: m.activo,
      timestamp: m.timestamp?.toString?.() ?? String(m.timestamp),
      ejecutor: m.ejecutor,
    });
  }
  return rows;
}

/** @param {import('ethers').Contract} contract */
async function scanCuentas(contract) {
  const rows = [];
  for (let i = 0; i < 100_000; i++) {
    let wallet;
    try {
      wallet = await contract.listaDirecciones(i);
    } catch {
      break;
    }
    if (!wallet || wallet === ZERO_ADDRESS) continue;
    const c = await contract.cuentas(wallet);
    if (!c.wallet || c.wallet === ZERO_ADDRESS) {
      rows.push({
        indiceLista: i,
        wallet: String(wallet),
        nota: 'Sin registro en mapping (posible borrado lógico)',
      });
      continue;
    }
    rows.push({
      indiceLista: i,
      wallet: c.wallet,
      nombre: c.nombre,
      fechaHora: c.fechaHora?.toString?.() ?? String(c.fechaHora),
      activa: c.activa,
    });
  }
  return rows;
}

/** @param {import('ethers').Contract} contract */
async function scanVinculos(contract, rolIds) {
  const rows = [];
  for (const rolId of rolIds) {
    const menuIds = await contract.obtenerMenusPorRol(rolId);
    for (const midRaw of menuIds) {
      const menuId = Number(midRaw);
      const activo = await contract.verificarAcceso(rolId, menuId);
      rows.push({ rolId, menuId, vinculoActivo: activo });
    }
  }
  return rows;
}

async function scanMongoLeads() {
  const uri = process.env.MONGODB_URI;
  if (!uri?.trim()) {
    return { skipped: true, reason: 'MONGODB_URI no definido', docs: [] };
  }
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const docs = await db.collection('market_leads').find({}).sort({ createdAt: -1 }).toArray();
    return { skipped: false, docs };
  } finally {
    await client.close().catch(() => {});
  }
}

function mdTable(headers, dataRows) {
  if (!dataRows.length) return '_Sin registros._\n';
  const h = `| ${headers.join(' | ')} |\n| ${headers.map(() => '---').join(' | ')} |\n`;
  const body = dataRows
    .map((cells) => `| ${cells.map((c) => esc(c)).join(' | ')} |\n`)
    .join('');
  return h + body;
}

const outPath = resolve(process.cwd(), process.argv[2] || process.env.RESPALDO_OUT || 'respaldo.md');

const contract = getContract();
const owner = await contract.owner();

const [roles, usuarios, menus, cuentas] = await Promise.all([
  scanRoles(contract),
  scanUsuarios(contract),
  scanMenus(contract),
  scanCuentas(contract),
]);

const rolIds = roles.map((r) => r.id);
const vinculos = await scanVinculos(contract, rolIds);

const mongo = await scanMongoLeads();

const now = new Date().toISOString();

let md = `# Respaldo RBAC (offline)

Generado: **${now}**  
Red / RPC: \`${esc(process.env.RPC_URL || '')}\`  
\`CHAIN_ID\`: ${esc(process.env.CHAIN_ID || '')}  
Contrato: \`${esc(process.env.CONTRACT_ADDRESS || '')}\`  
Owner (on-chain): \`${esc(owner)}\`

> Copia de seguridad para consulta sin depender del VPS. Los datos on-chain reflejan el estado actual del contrato en el nodo consultado.

---

## 1. Roles

${mdTable(
  ['id', 'nombre', 'activo', 'timestamp', 'ejecutor'],
  roles.map((r) => [r.id, r.nombre, r.activo, r.timestamp, r.ejecutor]),
)}

---

## 2. Usuarios

${mdTable(
  ['id', 'login', 'nombre', 'rolId', 'activo', 'timestamp', 'ejecutor'],
  usuarios.map((u) => [u.id, u.login, u.nombre, u.rolId, u.activo, u.timestamp, u.ejecutor]),
)}

---

## 3. Menús (vínculos / definición de menú)

${mdTable(
  ['id', 'nombre', 'activo', 'timestamp', 'ejecutor'],
  menus.map((m) => [m.id, m.nombre, m.activo, m.timestamp, m.ejecutor]),
)}

---

## 4. Vínculos menú ↔ rol

Cada fila: asociación en \`menusPorRol\` / \`verificarAcceso\`.

${mdTable(
  ['rolId', 'menuId', 'vinculoActivo'],
  vinculos.map((v) => [v.rolId, v.menuId, v.vinculoActivo]),
)}

---

## 5. Cuentas autorizadas

${mdTable(
  ['índice lista', 'wallet', 'nombre', 'fechaHora', 'activa', 'nota'],
  cuentas.map((c) => [
    c.indiceLista,
    c.wallet,
    c.nombre ?? '—',
    c.fechaHora ?? '—',
    c.activa ?? '—',
    c.nota ?? '',
  ]),
)}

---

## 6. Formulario Market (MongoDB — colección \`market_leads\`)

`;

if (mongo.skipped) {
  md += `_No exportado: ${mongo.reason}_\n`;
} else if (!mongo.docs.length) {
  md += '_Sin documentos en la colección._\n';
} else {
  md += mdTable(
    ['_id', 'walletAddress', 'email', 'nombreApellido', 'telefono', 'status', 'descripcion (recorte)', 'createdAt'],
    mongo.docs.map((d) => [
      String(d._id),
      d.walletAddress,
      d.email,
      d.nombreApellido ?? '',
      d.telefono ?? '',
      d.status ?? '',
      (d.descripcionAplicacion || '').slice(0, 80),
      d.createdAt instanceof Date ? d.createdAt.toISOString() : String(d.createdAt ?? ''),
    ]),
  );
  md += '\n\n### JSON completo (Market)\n\n```json\n';
  const plain = mongo.docs.map((d) => {
    const o = { ...d };
    if (o._id != null) o._id = String(o._id);
    if (o.createdAt instanceof Date) o.createdAt = o.createdAt.toISOString();
    if (o.updatedAt instanceof Date) o.updatedAt = o.updatedAt.toISOString();
    return o;
  });
  md += JSON.stringify(plain, null, 2);
  md += '\n```\n';
}

md += `\n---\n_Fin del respaldo._\n`;

writeFileSync(outPath, md, 'utf8');
console.log(`Respaldo escrito: ${outPath}`);
