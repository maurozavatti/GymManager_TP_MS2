import test from 'node:test'
import assert from 'node:assert/strict'
import { Readable } from 'node:stream'
import { ObjectId } from 'mongodb'

process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017'
process.env.MONGODB_DB = 'gymmanager_pruebas'

const { crearGestorPagos } = await import('../dist/controladores/pagos.js')

const clienteId = new ObjectId()
const pagoId = new ObjectId()

// Simula un pedido HTTP (con o sin cuerpo JSON)
function pedido(metodo, url, cuerpo) {
  const flujo = Readable.from(cuerpo ? [JSON.stringify(cuerpo)] : [])
  return Object.assign(flujo, {
    method: metodo,
    url,
    headers: { 'content-type': 'application/json' },
  })
}

// Simula la respuesta: guarda el código de estado y el cuerpo
function respuestaFalsa() {
  return {
    estado: 0,
    cuerpo: null,
    writeHead(estado) { this.estado = estado },
    end(texto) { this.cuerpo = JSON.parse(texto) },
  }
}

// Simula la base de datos y anota qué operaciones se hicieron
function baseFalsa(opciones = {}) {
  const llamadas = { insertOne: [], updateOne: [], updateMany: [] }
  const db = {
    collection(nombre) {
      if (nombre === 'clientes') {
        return { async findOne() { return opciones.clienteExiste === false ? null : { _id: clienteId } } }
      }
      if (nombre === 'pagos') {
        return {
          async insertOne(doc) { llamadas.insertOne.push(doc) },
          async updateOne() { llamadas.updateOne.push(1); return { matchedCount: opciones.pagoActualizable === false ? 0 : 1 } },
          async updateMany() { llamadas.updateMany.push(1) },
          find() { return { sort() { return { async toArray() { return [] } } } } },
        }
      }
      throw new Error('Coleccion inesperada en la prueba')
    },
  }
  return { db, llamadas }
}

// Arma el gestor de pagos con el usuario y la base falsos
function crearGestor(usuario, opciones) {
  const { db, llamadas } = baseFalsa(opciones)
  const gestor = crearGestorPagos({ conectar: async () => db, usuario: async () => usuario })
  return { gestor, llamadas }
}

const admin = { id: 'a'.repeat(24), rol: 'ADMIN' }

// ---------- CASO 1 ----------
test('Sin sesion rechaza con 401', async () => {
  const { gestor } = crearGestor(null)
  const res = respuestaFalsa()
  await gestor(pedido('GET', '/api/pagos'), res)
  assert.equal(res.estado, 401)
})

// ---------- CASO 2 ----------
test('ENTRENADOR recibe 403 en pagos', async () => {
  const { gestor } = crearGestor({ id: 'b'.repeat(24), rol: 'ENTRENADOR' })
  const res = respuestaFalsa()
  await gestor(pedido('GET', '/api/pagos'), res)
  assert.equal(res.estado, 403)
})

// ---------- CASO 3 ----------
test('ADMIN registra un pago ya pagado', async () => {
  const { gestor, llamadas } = crearGestor(admin)
  const res = respuestaFalsa()
  await gestor(pedido('POST', '/api/pagos', {
    clienteId: clienteId.toHexString(),
    tipo: 'CUOTA',
    monto: 15000,
    pagado: true,
  }), res)
  assert.equal(res.estado, 201)
  assert.equal(llamadas.insertOne.length, 1)
  assert.equal(llamadas.insertOne[0].estado, 'PAGADO')
})

// ---------- CASO 4 ----------
test('ADMIN registra una cuota pendiente con vencimiento', async () => {
  const { gestor, llamadas } = crearGestor(admin)
  const res = respuestaFalsa()
  await gestor(pedido('POST', '/api/pagos', {
    clienteId: clienteId.toHexString(),
    tipo: 'CUOTA',
    monto: 15000,
    fechaVencimiento: '2030-01-15',
  }), res)
  assert.equal(res.estado, 201)
  assert.equal(llamadas.insertOne[0].estado, 'PENDIENTE')
  assert.equal(llamadas.insertOne[0].fechaPago, null)
})

// ---------- CASO 5 ----------
test('Una cuota pendiente sin vencimiento da 400', async () => {
  const { gestor, llamadas } = crearGestor(admin)
  const res = respuestaFalsa()
  await gestor(pedido('POST', '/api/pagos', {
    clienteId: clienteId.toHexString(),
    tipo: 'CUOTA',
    monto: 15000,
  }), res)
  assert.equal(res.estado, 400)
  assert.equal(llamadas.insertOne.length, 0)
})

// ---------- CASO 6 ----------
test('Un tipo de pago invalido da 400', async () => {
  const { gestor } = crearGestor(admin)
  const res = respuestaFalsa()
  await gestor(pedido('POST', '/api/pagos', {
    clienteId: clienteId.toHexString(),
    tipo: 'OTRO',
    monto: 15000,
    pagado: true,
  }), res)
  assert.equal(res.estado, 400)
})

// ---------- CASO 7 ----------
test('Un monto invalido da 400', async () => {
  for (const monto of [0, 10.5, 100_000_001, '500']) {
    const { gestor } = crearGestor(admin)
    const res = respuestaFalsa()
    await gestor(pedido('POST', '/api/pagos', {
      clienteId: clienteId.toHexString(),
      tipo: 'CUOTA',
      monto,
      pagado: true,
    }), res)
    assert.equal(res.estado, 400, `monto ${monto}`)
  }
})

// ---------- CASO 8 ----------
test('Un cliente inexistente da 404', async () => {
  const { gestor } = crearGestor(admin, { clienteExiste: false })
  const res = respuestaFalsa()
  await gestor(pedido('POST', '/api/pagos', {
    clienteId: clienteId.toHexString(),
    tipo: 'CUOTA',
    monto: 15000,
    pagado: true,
  }), res)
  assert.equal(res.estado, 404)
})

// ---------- CASO 9 ----------
test('Marcar como pagado un pago pendiente da 200', async () => {
  const { gestor } = crearGestor(admin)
  const res = respuestaFalsa()
  await gestor(pedido('POST', '/api/pagos/pagar', { pagoId: pagoId.toHexString() }), res)
  assert.equal(res.estado, 200)
})

// ---------- CASO 10 ----------
test('Marcar como pagado uno ya pagado da 409', async () => {
  const { gestor } = crearGestor(admin, { pagoActualizable: false })
  const res = respuestaFalsa()
  await gestor(pedido('POST', '/api/pagos/pagar', { pagoId: pagoId.toHexString() }), res)
  assert.equal(res.estado, 409)
})

// ---------- CASO 11 ----------
test('Listar pagos responde 200 y actualiza los vencidos (efecto S-P2)', async () => {
  const { gestor, llamadas } = crearGestor(admin)
  const res = respuestaFalsa()
  await gestor(pedido('GET', '/api/pagos'), res)
  assert.equal(res.estado, 200)
  assert.equal(llamadas.updateMany.length, 1)
})

// ---------- CASO 12 ----------
test('Una ruta inexistente da 404', async () => {
  const { gestor } = crearGestor(admin)
  const res = respuestaFalsa()
  await gestor(pedido('POST', '/api/pagos/otra', {}), res)
  assert.equal(res.estado, 404)
})

// ---------- CASO 13 (bug conocido S-P1) ----------
test('ADMIN con rol en lista accede a pagos', async () => {
  const { gestor } = crearGestor({ id: 'c'.repeat(24), rol: ['ADMIN', 'ENTRENADOR'] })
  const res = respuestaFalsa()
  await gestor(pedido('GET', '/api/pagos'), res)
  assert.equal(res.estado, 200)
})