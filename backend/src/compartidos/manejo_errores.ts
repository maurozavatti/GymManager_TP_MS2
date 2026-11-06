
import type { ServerResponse } from 'node:http'
import { ErrorHTTP, responder } from './http.ts'

export function manejarError(respuesta: ServerResponse, error: unknown): void {
  if (error instanceof ErrorHTTP) {
    responder(respuesta, error.estado, {
      mensaje: error.message,
      campos: error.campos
    })
    return
  }

  console.error(error)

  responder(respuesta, 500, {
    mensaje: 'No pudimos completar la operación. Intentá nuevamente.'
  })
}
