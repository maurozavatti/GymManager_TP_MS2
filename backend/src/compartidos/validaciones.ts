import { ObjectId } from 'mongodb'
import { ErrorHTTP } from './errores.ts'


export function texto(datos: Record<string, unknown>, campo: string, maximo = 200, obligatorio = false): string {
  const valor = datos[campo] ?? ''
  if (typeof valor !== 'string' || valor.trim().length > maximo || (obligatorio && !valor.trim())) {
    throw new ErrorHTTP(400, `Revisá el campo ${campo}.`, [campo])
  }
  return valor.trim()
}

export function identificador(valor: unknown): ObjectId {
  if (typeof valor !== 'string' || !/^[a-f0-9]{24}$/i.test(valor)) {
    throw new ErrorHTTP(400, 'El identificador no es válido.')
  }
  return new ObjectId(valor)
}

export function entero(valor: unknown, campo: string, minimo: number, maximo: number): number {
  if (typeof valor !== 'number' || !Number.isInteger(valor) || valor < minimo || valor > maximo) {
    throw new ErrorHTTP(400, `Revisá el campo ${campo}.`, [campo])
  }
  return valor
}

export function fechaArgentina(valor: unknown, campo: string, finDelDia = false): Date {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    throw new ErrorHTTP(400, 'Ingresá una fecha válida.', [campo])
  }
  const fecha = new Date(`${valor}T${finDelDia ? '23:59:59.999' : '00:00:00.000'}-03:00`)
  if (!Number.isFinite(fecha.getTime()) || fecha.toLocaleDateString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' }) !== valor) {
    throw new ErrorHTTP(400, 'Ingresá una fecha válida.', [campo])
  }
  return fecha
}