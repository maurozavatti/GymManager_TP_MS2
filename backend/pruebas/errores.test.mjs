import test from 'node:test'
import assert from 'node:assert/strict'

/* Esta prueba usa una conexion simulada. Los valores locales
 permiten importar el modulo de base sin configurar Atlas.*/
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017'
process.env.MONGODB_DB = 'gymmanager_pruebas'

const { crearGestorResumen } = await import(
  '../dist/controladores/resumen.js'
)

function simularRespuesta() {
  let estado
  let cuerpo

  return {
    respuesta: {
      writeHead(codigo) {
        estado = codigo
      },
      end(datos) {
        cuerpo = JSON.parse(datos)
      }
    },
    resultado() {
      return { estado, cuerpo }
    }
  }
}

test('resumen responde 401 cuando no hay sesion', async () => {
  const { respuesta, resultado } = simularRespuesta()

  const gestionar = crearGestorResumen({
    usuario: async () => null,
    conectar: async () => {
      throw new Error('No deberia consultar la base')
    }
  })

  await gestionar(
    { method: 'GET', url: '/api/resumen' },
    respuesta
  )

  assert.equal(resultado().estado, 401)
  assert.equal(
    resultado().cuerpo.mensaje,
    'Iniciá sesión para continuar.'
  )
})

test('resumen responde 500 sin exponer errores internos', async () => {
  const { respuesta, resultado } = simularRespuesta()

  const gestionar = crearGestorResumen({
    usuario: async () => ({ rol: 'ADMIN' }),
    conectar: async () => {
      throw new Error('Detalle interno de la base')
    }
  })

  await gestionar(
    { method: 'GET', url: '/api/resumen' },
    respuesta
  )

  assert.equal(resultado().estado, 500)
  assert.equal(
    resultado().cuerpo.mensaje,
    'No pudimos completar la operación. Intentá nuevamente.'
  )
  assert.ok(
    !JSON.stringify(resultado().cuerpo).includes('Detalle interno')
  )
})

test('resumen registra los errores inesperados', async () => {
  const { respuesta } = simularRespuesta()
  const fallo = new Error('Falla interna simulada')
  const registros = []

  const gestionar = crearGestorResumen({
    usuario: async () => ({ rol: 'ADMIN' }),
    conectar: async () => {
      throw fallo
    }
  })

  const consoleErrorOriginal = console.error
  console.error = (...argumentos) => {
    registros.push(argumentos)
  }

  try {
    await gestionar(
      { method: 'GET', url: '/api/resumen' },
      respuesta
    )
  } finally {
    console.error = consoleErrorOriginal
  }

  assert.ok(
    registros.some(argumentos => argumentos.includes(fallo)),
    'El error inesperado deberia registrarse'
  )
})

test('resumen permite acceder a una cuenta con varios roles', async () => {
  const { respuesta, resultado } = simularRespuesta()

  const baseSimulada = {
    collection(nombre) {
      if (nombre === 'turnos') {
        return {
          find: () => ({
            sort: () => ({ toArray: async () => [] })
          })
        }
      }

      if (nombre === 'clientes') {
        return { countDocuments: async () => 0 }
      }

      if (nombre === 'pagos') {
        return {
          find: () => ({ toArray: async () => [] }),
          countDocuments: async () => 0
        }
      }

      throw new Error('Coleccion no simulada')
    }
  }

  const gestionar = crearGestorResumen({
    usuario: async () => ({
      id: 'admin-prueba',
      rol: ['ENTRENADOR', 'ADMIN']
    }),
    conectar: async () => baseSimulada
  })

  await gestionar(
    { method: 'GET', url: '/api/resumen' },
    respuesta
  )

  assert.equal(resultado().estado, 200)
  assert.ok(resultado().cuerpo.resumen.administrativo)
})

test('resumen muestra solo los turnos propios de un entrenador con varios roles', async () => {
  const { respuesta, resultado } = simularRespuesta()

  const turnosSimulados = [
    {
      entrenadorId: { toHexString: () => 'entrenador-1' },
      horaInicio: '09:00',
      horaFin: '10:00',
      capacidad: 5,
      clientes: []
    },
    {
      entrenadorId: { toHexString: () => 'entrenador-2' },
      horaInicio: '10:00',
      horaFin: '11:00',
      capacidad: 5,
      clientes: []
    }
  ]

  const gestionar = crearGestorResumen({
    usuario: async () => ({
      id: 'entrenador-1',
      rol: ['ENTRENADOR', 'USUARIO']
    }),
    conectar: async () => ({
      collection: () => ({
        find: () => ({
          sort: () => ({
            toArray: async () => turnosSimulados
          })
        })
      })
    })
  })

  await gestionar(
    { method: 'GET', url: '/api/resumen' },
    respuesta
  )

  assert.equal(resultado().estado, 200)
  assert.equal(resultado().cuerpo.resumen.administrativo, null)

  const turnos = resultado().cuerpo.resumen.turnosHoy.turnos

  assert.equal(turnos.length, 1)
  assert.equal(turnos[0].horaInicio, '09:00')
})
