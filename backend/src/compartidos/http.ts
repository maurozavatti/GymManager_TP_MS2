import type { IncomingMessage, ServerResponse } from 'node:http'
import { ErrorHTTP } from './errores.ts'

export { ErrorHTTP } from './errores.ts'

export function responder(respuesta: ServerResponse, estado: number, datos: unknown): void {
  respuesta.writeHead(estado, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  })
  respuesta.end(JSON.stringify(datos))
}

export async function leerJSON(solicitud: IncomingMessage, limiteBytes = 65536): Promise<Record<string, unknown>> {
  const tipoContenido = solicitud.headers['content-type']?.split(';')[0].trim().toLowerCase()
  if (tipoContenido !== 'application/json') {
    throw new ErrorHTTP(415, 'Enviá los datos en formato JSON.')
  }

  let cuerpo = ''
  let demasiadoGrande = false
  solicitud.setEncoding('utf8')

  for await (const parte of solicitud) {
    if (demasiadoGrande) continue
    cuerpo += parte
    if (Buffer.byteLength(cuerpo, 'utf8') > limiteBytes) {
      demasiadoGrande = true
      cuerpo = ''
    }
  }

  if (demasiadoGrande) {
    throw new ErrorHTTP(413, 'Los datos enviados son demasiado extensos.')
  }

  let datos: unknown
  try {
    datos = JSON.parse(cuerpo)
  } catch {
    throw new ErrorHTTP(400, 'El formato JSON no es válido.')
  }

  if (datos === null || typeof datos !== 'object' || Array.isArray(datos)) {
    throw new ErrorHTTP(400, 'Los datos no son válidos.')
  }

  return datos as Record<string, unknown>
}

export {
  texto,
  identificador,
  entero,
  fechaArgentina
} from './validaciones.ts'