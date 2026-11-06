
import test from 'node:test'
import assert from 'node:assert/strict'
import { Readable } from 'node:stream'
import { ObjectId } from 'mongodb'

process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017'
process.env.MONGODB_DB = 'gymmanager_pruebas'

const { crearGestorTurnos } = await import('../dist/controladores/turnos.js')

const entrenadorId = new ObjectId()
const otroEntrenadorId = new ObjectId()
const turnoId = new ObjectId()

// Simula un pedido HTTP
function pedido(metodo, url, cuerpo) {
  const flujo = Readable.from(cuerpo ? [JSON.stringify(cuerpo)] : [])
  return Object.assign(flujo, {
    method: metodo,
    url,
    headers: { 'content-type': 'application/json' },
  })
}

// Simula la respuesta HTTP
function respuestaFalsa() {
  return {
    estado: 0,
    cuerpo: null,
    writeHead(estado) { this.estado = estado },
    end(texto) { this.cuerpo = JSON.parse(texto) },
  }
}

// Simula un turno guardado
function crearTurno(idEntrenador) {
  return {
    _id: turnoId,
    entrenadorId: idEntrenador,
    dia: 'LUNES',
    horaInicio: '09:00',
    horaFin: '10:00',
    capacidad: 5,
    activo: true,
    clientes: [],
  }
}

// Simula la base de datos
function crearBase(idEntrenadorDelTurno) {
  const llamadas = { updateOne: [] }
  const turno = crearTurno(idEntrenadorDelTurno)

  const db = {
    collection(nombre) {
      if (nombre === 'turnos') {
        return {
          async findOne() {
            return turno
          },
          async updateOne(filtro, cambios) {
            llamadas.updateOne.push({ filtro, cambios })
            return { modifiedCount: 1 }
          },
        }
      }

      throw new Error(`Colección inesperada: ${nombre}`)
    },
  }

  return { db, llamadas }
}

// Construye el gestor con dependencias simuladas
function crearGestor(usuario, idEntrenadorDelTurno = entrenadorId) {
  const { db, llamadas } = crearBase(idEntrenadorDelTurno)

  const gestor = crearGestorTurnos({
    conectar: async () => db,
    usuario: async () => usuario,
    transaccion: async () => {},
  })

  return { gestor, llamadas }
}

// ---------- CASO 1 ----------
test('Sin sesión rechaza con 401', async () => {
  const { gestor } = crearGestor(null)
  const res = respuestaFalsa()

  await gestor(pedido('POST', '/api/turnos/estado', {
    turnoId: turnoId.toHexString(),
    activo: false,
  }), res)

  assert.equal(res.estado, 401)
})

// ---------- CASO 2 ----------
test('Un entrenador puede modificar sus propios turnos', async () => {
  const usuario = {
    id: entrenadorId.toHexString(),
    rol: 'ENTRENADOR',
  }

  const { gestor, llamadas } = crearGestor(usuario, entrenadorId)
  const res = respuestaFalsa()

  await gestor(pedido('POST', '/api/turnos/estado', {
    turnoId: turnoId.toHexString(),
    activo: false,
  }), res)

  assert.equal(res.estado, 200)
  assert.equal(llamadas.updateOne.length, 1)
})

// ---------- CASO 3 ----------
test('Un entrenador no puede modificar turnos ajenos', async () => {
  const usuario = {
    id: entrenadorId.toHexString(),
    rol: 'ENTRENADOR',
  }

  const { gestor, llamadas } = crearGestor(usuario, otroEntrenadorId)
  const res = respuestaFalsa()

  await gestor(pedido('POST', '/api/turnos/estado', {
    turnoId: turnoId.toHexString(),
    activo: false,
  }), res)

  assert.equal(res.estado, 403)
  assert.equal(llamadas.updateOne.length, 0)
})

// ---------- CASO 4 ----------
test('Un entrenador con rol en lista puede modificar sus propios turnos', async () => {
  const usuario = {
    id: entrenadorId.toHexString(),
    rol: ['ENTRENADOR'],
  }

  const { gestor, llamadas } = crearGestor(usuario, entrenadorId)
  const res = respuestaFalsa()

  await gestor(pedido('POST', '/api/turnos/estado', {
    turnoId: turnoId.toHexString(),
    activo: false,
  }), res)

  assert.equal(res.estado, 200)
  assert.equal(llamadas.updateOne.length, 1)
})

// ---------- CASO 5 ----------
test('Un entrenador con rol en lista no puede modificar turnos ajenos', async () => {
  const usuario = {
    id: entrenadorId.toHexString(),
    rol: ['ENTRENADOR'],
  }

  const { gestor, llamadas } = crearGestor(usuario, otroEntrenadorId)
  const res = respuestaFalsa()

  await gestor(pedido('POST', '/api/turnos/estado', {
    turnoId: turnoId.toHexString(),
    activo: false,
  }), res)

  assert.equal(res.estado, 403)
  assert.equal(llamadas.updateOne.length, 0)
})

// ---------- CASO 6 ----------
test('Un usuario sin permisos recibe 403', async () => {
  const usuario = {
    id: 'a'.repeat(24),
    rol: 'USUARIO',
  }

  const { gestor, llamadas } = crearGestor(usuario)
  const res = respuestaFalsa()

  await gestor(pedido('POST', '/api/turnos/estado', {
    turnoId: turnoId.toHexString(),
    activo: false,
  }), res)

  assert.equal(res.estado, 403)
  assert.equal(llamadas.updateOne.length, 0)
})
test('Un error inesperado responde 500 sin exponer detalles internos', async () => {
  const usuario = { id: entrenadorId.toHexString(), rol: 'ADMIN' }

  const gestor = crearGestorTurnos({
    conectar: async () => {
      throw new Error('Detalle privado de la conexión')
    },
    usuario: async () => usuario,
    transaccion: async () => {},
  })

  const res = respuestaFalsa()

  await gestor(pedido('GET', '/api/turnos'), res)

  assert.equal(res.estado, 500)
  assert.deepEqual(res.cuerpo, {
    mensaje: 'No pudimos completar la operación. Intentá nuevamente.',
  })
})

test('No permite generar una agenda con franjas horarias superpuestas', async () => {
  const usuario = {
    id: entrenadorId.toHexString(),
    rol: 'ADMIN',
  }

  const db = {
    collection(nombre) {
      if (nombre === 'configuracion') {
        return {
          async findOne() {
            return null
          },
        }
      }

      throw new Error(`Colección inesperada: ${nombre}`)
    },
  }

  const gestor = crearGestorTurnos({
    conectar: async () => db,
    usuario: async () => usuario,
    transaccion: async () => {},
  })

  const res = respuestaFalsa()

  await gestor(pedido('POST', '/api/turnos/generar', {
    capacidad: 5,
    franjas: [
      { inicio: '09:00', fin: '12:00' },
      { inicio: '11:00', fin: '13:00' },
    ],
    trabajos: [],
  }), res)

  assert.equal(res.estado, 400)
  assert.equal(
    res.cuerpo.mensaje,
    'Las franjas de apertura no pueden superponerse.',
  )
})
