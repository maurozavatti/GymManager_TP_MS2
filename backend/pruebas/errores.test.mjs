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
