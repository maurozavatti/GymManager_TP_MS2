
import test from 'node:test'
import assert from 'node:assert/strict'
import { Readable } from 'node:stream'

import {
  ErrorHTTP,
  responder,
  leerJSON,
  texto,
  entero,
  identificador,
  fechaArgentina
} from '../dist/compartidos/http.js'

// Comprueba que ErrorHTTP conserva los datos del error.
test('ErrorHTTP conserva estado, mensaje y campos', () => {
  const error = new ErrorHTTP(400, 'Datos invalidos', ['nombre'])

  assert.equal(error.name, 'ErrorHTTP')
  assert.equal(error.estado, 400)
  assert.equal(error.message, 'Datos invalidos')
  assert.deepEqual(error.campos, ['nombre'])
})

// Comprueba el formato de la respuesta HTTP.
test('responder devuelve el estado y los datos en JSON', () => {
  let estadoRecibido
  let encabezadosRecibidos
  let cuerpoRecibido

  const respuestaSimulada = {
    writeHead(estado, encabezados) {
      estadoRecibido = estado
      encabezadosRecibidos = encabezados
    },
    end(cuerpo) {
      cuerpoRecibido = cuerpo
    },
  }

  responder(respuestaSimulada, 201, { mensaje: 'Creado' })

  assert.equal(estadoRecibido, 201)
  assert.equal(
    encabezadosRecibidos['Content-Type'],
    'application/json; charset=utf-8'
  )
  assert.equal(encabezadosRecibidos['Cache-Control'], 'no-store')
  assert.deepEqual(JSON.parse(cuerpoRecibido), {
    mensaje: 'Creado',
  })
})


test('leerJSON acepta un objeto JSON valido', async () => {
  const solicitud = Object.assign(
    Readable.from([JSON.stringify({ nombre: 'Emanuel' })]),
    { headers: { 'content-type': 'application/json' } }
  )

  const datos = await leerJSON(solicitud)

  assert.deepEqual(datos, { nombre: 'Emanuel' })
})

test('leerJSON rechaza contenido que no es JSON con 415', async () => {
  const solicitud = Object.assign(
    Readable.from(['nombre=Emanuel']),
    { headers: { 'content-type': 'text/plain' } }
  )

  await assert.rejects(
    () => leerJSON(solicitud),
    (error) => error instanceof ErrorHTTP && error.estado === 415
  )
})

test('texto valida y elimina espacios', () => {
  assert.equal(
    texto({ nombre: '  Emanuel  ' }, 'nombre', 50, true),
    'Emanuel'
  )

  assert.throws(
    () => texto({ nombre: '' }, 'nombre', 50, true),
    (error) => error instanceof ErrorHTTP &&
      error.estado === 400 &&
      error.campos.includes('nombre')
  )
})

test('entero acepta valores dentro del rango y rechaza invalidos', () => {
  assert.equal(entero(5, 'cantidad', 1, 10), 5)

  assert.throws(
    () => entero(15, 'cantidad', 1, 10),
    (error) => error instanceof ErrorHTTP &&
      error.estado === 400 &&
      error.campos.includes('cantidad')
  )
})

test('identificador acepta un ObjectId valido y rechaza invalidos', () => {
  const id = '507f1f77bcf86cd799439011'

  assert.equal(identificador(id).toHexString(), id)

  assert.throws(
    () => identificador('123'),
    (error) => error instanceof ErrorHTTP &&
      error.estado === 400
  )
})

test('fechaArgentina acepta fechas validas y rechaza invalidas', () => {
  const fecha = fechaArgentina('2026-11-05', 'fecha')

  assert.equal(fecha.toISOString(), '2026-11-05T03:00:00.000Z')

  assert.throws(
    () => fechaArgentina('2026-02-30', 'fecha'),
    (error) => error instanceof ErrorHTTP &&
      error.estado === 400 &&
      error.campos.includes('fecha')
  )
})