import type { Db } from 'mongodb'

export const estadosPago = {
    pendiente: 'PENDIENTE',
    vencido: 'VENCIDO',
    pagado: 'PAGADO',
} as const

/* Marca como vencidos los pagos pendientes cuya fecha de vencimiento ya pasó. */
export async function promoverVencidos(db: Db): Promise<void> {
    await db.collection('pagos').updateMany(
        { estado: estadosPago.pendiente, fechaVencimiento: { $lt: new Date() } },
        { $set: { estado: estadosPago.vencido } },
    )
}