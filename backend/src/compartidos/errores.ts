export class ErrorHTTP extends Error {
  estado: number
  campos: string[]

  constructor(estado: number, mensaje: string, campos: string[] = []) {
    super(mensaje)
    this.name = 'ErrorHTTP'
    this.estado = estado
    this.campos = campos
  }
}