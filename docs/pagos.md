# Análisis y refactorización del módulo de Pagos

**Trabajo Práctico Integrador — Metodología de Sistemas II**

**Sistema:** Gym Manager  
**Integrante responsable:** Mauro Alberto Zavatti  
**Rama de trabajo:** `feature/pagos`

## 1. Objetivo y alcance

Este trabajo se enfoca en el módulo de Pagos del backend de Gym Manager, que permite listar pagos, registrar inscripciones y cuotas, y marcar pagos como pagados.

Se busca detectar problemas en el código, aplicar principios SOLID y buenas prácticas de Clean Code, realizar los refactorings necesarios y comprobar mediante pruebas que los cambios no afecten el funcionamiento del sistema.

### 1.1 Archivos principales

- `backend/src/controladores/pagos.ts`
- `backend/src/servicios/pagos.ts` (creado durante el trabajo)
- `backend/pruebas/pagos.test.mjs` (creado durante el trabajo)

### 1.2 Entorno de trabajo

El repositorio del grupo, `GymManager_TP_MS2`, se armó a partir de una copia del backend del TFI. El estado de partida quedó registrado con el tag `estado-inicial` (commit `3174e73`). Para este módulo se trabajó en la rama `feature/pagos`, de modo que los cambios se desarrollaron sin afectar la rama principal (`main`).

Cada modificación se guardó en un commit individual para facilitar su revisión e integración.

### 1.3 Verificación inicial

Antes de realizar modificaciones, se instalaron las dependencias del backend con `npm ci` y se ejecutó `npm test` para comprobar las pruebas existentes.

- Compilación de TypeScript: correcta.
- Pruebas ejecutadas: 8 (archivo `permisos.test.mjs`).
- Pruebas aprobadas: 8.
- Pruebas fallidas: 0.
- Vulnerabilidades informadas: 0.

Las pruebas existentes cubrían solo permisos. No había pruebas automáticas del módulo de Pagos.

**Evidencia:** `evidencias/tests-estado-inicial.txt`

## 2. Diagnóstico de calidad interna

Las líneas indicadas corresponden al estado inicial del proyecto (tag `estado-inicial`).

### 2.1 Code smells detectados

#### S-P1 — Lógica de autorización duplicada e inconsistente

**Tipo:** Duplicación de lógica de autorización.

**Ubicación:** `backend/src/controladores/pagos.ts` (línea 87). También `backend/src/controladores/turnos.ts` (líneas 24, 165, 194, 235, 246 y 269).

**Evidencia:** El gestor compara el rol con un texto (`personal.rol !== 'ADMIN'`), mientras que `permisos.ts` ya ofrece `tieneRol` para cuentas con roles múltiples.

**Impacto:** La regla de permisos está repetida en cada controlador y no sigue la abstracción que ya existe.

**Riesgo:** Las cuentas con rol en formato lista reciben 403 aunque tengan permiso. El defecto fue confirmado con el autor de la gestión de roles.

**Prioridad:** Alta.

**Mejora propuesta:** Reemplazar la comparación directa por `tieneRol`.

#### S-P2 — Efecto secundario en una consulta

**Tipo:** Efecto secundario oculto.

**Ubicación:** `backend/src/controladores/pagos.ts` (línea 18).

**Evidencia:** `listarPagos` llama a `promoverVencidos(db)`, que ejecuta un `updateMany`. Una consulta GET modifica datos.

**Impacto:** La consulta deja de ser predecible y no puede probarse sin escritura.

**Riesgo:** Cada listado escribe en la base, con costo adicional y posibles condiciones de carrera.

**Prioridad:** Alta.

**Mejora propuesta:** Separar la consulta del cambio de estado. Resolverlo cambia el comportamiento, por lo que no es un refactoring puro.

#### S-P3 — Errores inesperados sin registrar

**Tipo:** Manejo inadecuado de excepciones.

**Ubicación:** `backend/src/controladores/pagos.ts` (línea 116).

**Evidencia:** Ante un error inesperado se responde 500 sin registrar el error original.

**Impacto:** Los fallos internos no dejan rastro.

**Riesgo:** Los errores en producción son difíciles de diagnosticar.

**Prioridad:** Alta.

**Mejora propuesta:** Registrar el error antes de responder.

#### S-P4 — Función con múltiples responsabilidades

**Tipo:** Función larga (violación de SRP).

**Ubicación:** `backend/src/controladores/pagos.ts` (líneas 36–68, `registrarPago`).

**Evidencia:** Una sola función valida la entrada, consulta al cliente, decide el estado del pago y persiste.

**Impacto:** Es difícil de leer, de probar por partes y de modificar.

**Riesgo:** Un cambio en una regla puede romper otra.

**Prioridad:** Media.

**Mejora propuesta:** Extraer funciones con un solo propósito.

#### S-P5 — Duplicación de código

**Tipo:** Duplicación de código.

**Ubicación:** `backend/src/controladores/pagos.ts` (líneas 50–59 y 62–67).

**Evidencia:** Dos `insertOne` casi idénticos, que difieren en `estado`, `fechaPago` y `fechaVencimiento`.

**Impacto:** Cada cambio en los campos debe hacerse en dos lugares.

**Riesgo:** Los dos documentos pueden divergir si se olvida actualizar uno.

**Prioridad:** Baja.

**Mejora propuesta:** Construir el documento en una función y usar un solo `insertOne`.

#### S-P6 — Valores literales (strings mágicos)

**Tipo:** Obsesión por primitivos.

**Ubicación:** `backend/src/controladores/pagos.ts` (líneas 12–13, 54, 65 y 73–74).

**Evidencia:** `'PENDIENTE'`, `'VENCIDO'` y `'PAGADO'` están escritos como texto en varios lugares.

**Impacto:** Un error de tipeo no es detectado por el compilador.

**Riesgo:** Podrían guardarse estados inválidos.

**Prioridad:** Media.

**Mejora propuesta:** Definir los estados como constantes.

#### S-P7 — Ausencia de modelo de dominio

**Tipo:** Falta de tipado del dominio.

**Ubicación:** `backend/src/controladores/pagos.ts` (líneas 21, 51 y 62) y `backend/src/compartidos/modelos.ts`.

**Evidencia:** `db.collection('pagos')` se usa sin tipo, y `modelos.ts` define `Turno` pero no `Pago`.

**Impacto:** Los campos se leen sin garantías de tipo.

**Riesgo:** Errores de campo que solo aparecen en ejecución.

**Prioridad:** Media.

**Mejora propuesta:** Definir una interfaz `Pago` y tipar la colección.

#### S-P8 — Acoplamiento a la persistencia

**Tipo:** Acoplamiento de las reglas de negocio con la base de datos.

**Ubicación:** `backend/src/controladores/pagos.ts` (líneas 11, 21, 47, 51, 62 y 72).

**Evidencia:** Las reglas de negocio llaman directamente a `db.collection(...)`.

**Impacto:** No se puede cambiar o simular la base sin reescribir la lógica.

**Riesgo:** Pruebas lentas o con simulaciones frágiles.

**Prioridad:** Media.

**Mejora propuesta:** Mover las reglas a un servicio y, más adelante, un repositorio de pagos.

#### S-P9 — Manejo de errores duplicado entre controladores

**Tipo:** Duplicación de código.

**Ubicación:** `backend/src/controladores/pagos.ts` (líneas 111–117), equivalente a `turnos.ts` (líneas 309–315).

**Evidencia:** El bloque `catch` se repite con la misma estructura en cada gestor.

**Impacto:** Cualquier cambio en el manejo de errores debe replicarse.

**Riesgo:** Los controladores pueden terminar respondiendo distinto ante errores similares.

**Prioridad:** Media.

**Mejora propuesta:** Usar una función compartida de manejo de errores.

#### S-P10 — Código muerto

**Tipo:** Código sin uso.

**Ubicación:** `backend/src/controladores/pagos.ts` (línea 3).

**Evidencia:** `import { ObjectId } from 'mongodb'` sin ningún uso.

**Impacto:** Ruido que confunde al lector.

**Riesgo:** Bajo.

**Prioridad:** Baja.

**Mejora propuesta:** Eliminar la importación.

## 3. Análisis de SOLID y Clean Code

### 3.1 Relación con los problemas detectados

**S-P4 — Función con múltiples responsabilidades (SRP)**

`registrarPago` valida los datos, consulta al cliente, decide el estado del pago y persiste. El gestor `gestionarPagos` además enruta, autoriza y maneja errores. Separar estas tareas mejora la cohesión y facilita las modificaciones.

**S-P8 — Acoplamiento a la persistencia (DIP)**

`crearGestorPagos` recibe `conectar` y `usuario` como dependencias, lo que permite simularlas en pruebas. Sin embargo, las reglas de negocio dependen directamente de `db.collection(...)`. Un repositorio de pagos permitiría depender de una abstracción.

**S-P1 — Autorización duplicada (DIP y SRP)**

El controlador decide por sí mismo quién puede entrar, en lugar de depender de la abstracción que ya existe en `permisos.ts` (`tieneRol`).

**Extensibilidad (OCP)**

Agregar un tipo de pago es sencillo (`tiposPago`), pero agregar una ruta obliga a modificar la cadena de `if` del gestor. Una tabla de rutas y acciones permitiría extender sin modificar el flujo existente.

**S-P5 — Duplicación de inserciones (DRY)**

Los dos `insertOne` casi iguales van en contra del principio DRY.

**S-P2 — Efecto secundario en una consulta (Clean Code)**

Una función de consulta no debería escribir en la base. Conviene separar la lectura del cambio de estado.

**S-P6, S-P3 y S-P10 (Clean Code)**

Los textos literales deberían ser constantes, los errores inesperados deberían registrarse y las importaciones sin uso deberían eliminarse.

**LSP e ISP**

No tienen una aplicación significativa en este módulo, que no usa herencia ni interfaces extensas.

### 3.2 Objetivo de las mejoras

Las mejoras buscan reducir la duplicación, separar responsabilidades y facilitar el mantenimiento. Antes de aplicar los refactorings se prepararon pruebas de caracterización para comprobar el comportamiento actual, y después de cada modificación se volvieron a ejecutar.

## 4. Pruebas de caracterización

### 4.1. Pruebas antes del refactoring

Antes de modificar el código, se incorporó el archivo `backend/pruebas/pagos.test.mjs` con 13 casos que describen el comportamiento actual del módulo:

1. Sin sesión: responde 401.
2. Rol ENTRENADOR: responde 403.
3. Registrar un pago ya pagado: 201, inserta con estado `PAGADO`.
4. Registrar una cuota pendiente con vencimiento: 201, estado `PENDIENTE`, sin fecha de pago.
5. Cuota pendiente sin vencimiento: 400 y no inserta.
6. Tipo de pago inválido: 400.
7. Monto inválido (0, decimal, mayor al máximo, texto): 400.
8. Cliente inexistente o inactivo: 404.
9. Marcar como pagado un pago pendiente: 200.
10. Marcar como pagado uno ya pagado: 409.
11. Listar pagos: 200 y ejecuta la actualización de vencidos (documenta S-P2).
12. Ruta inexistente: 404.
13. Administrador con rol en formato lista: debería responder 200; en el estado inicial responde 403 (documenta S-P1). Se marcó como pendiente conocido (`todo`) para que `npm test` siga en verde mientras el defecto está documentado.

Las pruebas usan dependencias simuladas, por lo que no requieren conexión a MongoDB. También se actualizó `npm test` para ejecutar este archivo junto con las 8 pruebas de permisos.

**Resultado:** 21 pruebas ejecutadas, 20 aprobadas, 0 fallidas y 1 pendiente conocida (caso 13). Compilación de TypeScript sin errores.

**Evidencia:** `evidencias/tests-pagos-antes.txt`

## 5. Refactorings y correcciones realizadas

### 5.1. R-1 — Eliminar importación sin uso (S-P10)

**Problema detectado:** `pagos.ts` importaba `ObjectId` sin utilizarlo.

**Refactoring aplicado:** Eliminación de código muerto. Se borró la importación.

**Verificación:** `npm test`: 20 aprobadas, 0 fallidas, 1 pendiente conocida.

**Commit:** `d6e49b9` — `refactor(pagos): eliminar importacion sin uso de ObjectId (S-P10)`.

### 5.2. R-2 — Constantes para los estados de pago (S-P6)

**Problema detectado:** Los estados `'PENDIENTE'`, `'VENCIDO'` y `'PAGADO'` estaban escritos como texto en seis líneas.

**Refactoring aplicado:** Se definió `estadosPago` con las tres constantes y se reemplazaron los usos (Replace Magic Literal).

**Mejora obtenida:** El compilador detecta errores de tipeo en los estados.

**Verificación:** `npm test`: 20 aprobadas, 0 fallidas, 1 pendiente conocida.

**Commit:** `999361e` — `refactor(pagos): constantes para los estados de pago (S-P6)`.

### 5.3. R-3 — Extraer la lectura y la construcción del pago (S-P4 y S-P5)

**Problema detectado:** `registrarPago` mezclaba validación, consulta, decisión del estado y persistencia, con dos `insertOne` casi idénticos.

**Refactoring aplicado:** Extract Method e Introduce Parameter Object.

- `leerDatosPago`: valida la entrada y devuelve un objeto `DatosPago`.
- `armarDocumentoPago`: arma el documento según el pago esté pagado o pendiente.
- `registrarPago`: queda con el flujo de leer, buscar al cliente, insertar con un solo `insertOne` y responder.

**Mejora obtenida:** Se separaron responsabilidades y se eliminó la duplicación. El orden de los errores se conserva: el 404 del cliente sigue antes del 400 por falta de vencimiento.

**Verificación:** `npm test`: 20 aprobadas, 0 fallidas, 1 pendiente conocida.

**Commit:** `457b295` — `refactor(pagos): extraer leerDatosPago y armarDocumentoPago de registrarPago (S-P4, S-P5)`.

### 5.4. R-4 — Mover reglas de pagos a un servicio (S-P4 y S-P8)

**Problema detectado:** La regla de vencimiento y la constante de estados vivían dentro del controlador HTTP.

**Refactoring aplicado:** Move Method. Se creó `backend/src/servicios/pagos.ts`, que exporta `estadosPago` y `promoverVencidos`, y el controlador los importa.

**Mejora obtenida:** Las reglas de negocio quedaron fuera del controlador.

**Alcance:** No resuelve S-P2. La consulta sigue escribiendo, porque eliminar ese efecto cambiaría el comportamiento.

**Verificación:** `npm test`: 20 aprobadas, 0 fallidas, 1 pendiente conocida.

**Commit:** `053924b` — `refactor(pagos): mover promoverVencidos y estadosPago a servicios/pagos (S-P4, S-P8)`.

### 5.5. F-1 — Corrección de autorización con roles en lista (S-P1)

**Problema detectado:** `pagos.ts` comparaba el rol con un texto. Las cuentas con rol en formato lista recibían 403, aunque fueran administradoras.

**Corrección aplicada:** Se reemplazó `personal.rol !== 'ADMIN'` por `!tieneRol(personal, ['ADMIN'])`, función que ya existía en `permisos.ts`.

Esta corrección **no es un refactoring**, porque cambia el resultado para un caso (cuentas con roles en lista). Por eso se hizo en un commit separado.

**Verificación:** El caso 13 pasó de pendiente conocido a aprobado. Se le quitó la marca `todo`. Los casos 1 a 12 mantienen su resultado.

**Resultado final:** 21 pruebas aprobadas, 0 fallidas, 0 pendientes. Compilación sin errores.

**Commit:** `116b03f` — `fix(pagos): usar tieneRol para aceptar cuentas con roles en formato lista (S-P1)`.

**Evidencia:** `evidencias/tests-pagos-despues.txt`

## 6. Estado y pendientes

| Smell | Estado |
|---|---|
| S-P1 | Corregido en `pagos.ts` (F-1). Pendiente en otros controladores: ver `docs/turnos.md` y `docs/refactoring_transversal.md`. |
| S-P3 | Corregido en `pagos.ts` por la rama transversal (R-T04, commit `6600a07`, documentado en `docs/refactoring_transversal.md`). |
| S-P4 y S-P5 | Resueltos (R-3). |
| S-P6 | Resuelto (R-2). |
| S-P8 | Mejorado parcialmente (R-4). Las consultas siguen en el controlador. |
| S-P9 | Corregido en `pagos.ts` por la rama transversal (R-T04). |
| S-P10 | Resuelto (R-1). |
| S-P2 | Pendiente. Resolverlo cambia el comportamiento. |
| S-P7 | Pendiente. Falta definir el modelo `Pago`. |

## 7. Resumen de pruebas antes y después

| Etapa | Pruebas aprobadas | Pruebas fallidas | Pendientes | Resultado |
|---|---:|---:|---:|---|
| Estado inicial | 8 | 0 | 0 | Pruebas originales de permisos |
| Con las 13 pruebas de pagos | 20 | 0 | 1 | Caso 13 documenta S-P1 |
| R-1 | 20 | 0 | 1 | Sin regresiones |
| R-2 | 20 | 0 | 1 | Sin regresiones |
| R-3 | 20 | 0 | 1 | Sin regresiones |
| R-4 | 20 | 0 | 1 | Sin regresiones |
| F-1 | 21 | 0 | 0 | Corrección verificada |

Los casos 1 a 12 mantuvieron su resultado durante los cuatro refactorings, lo que muestra que el comportamiento externo no cambió. El caso 13 pasó de pendiente conocido a aprobado luego de la corrección F-1.

Las pruebas utilizan dependencias simuladas y no requieren una conexión activa a MongoDB.

## 8. Conclusión individual

En este módulo escribí primero las pruebas de caracterización y después apliqué los refactorings de a uno, verificando que nada cambiara. Aprendí que un refactoring no puede cambiar el comportamiento, y que cuando encontramos el defecto de los roles había que corregirlo en un commit aparte. Quedan pendientes el efecto secundario al listar pagos y el modelo de datos de Pago

## 9. Declaración individual de uso de inteligencia artificial

**Herramienta utilizada:** Claude, de Anthropic.

**Propósito:** Se utilizó como asistencia durante el análisis del código, la detección de code smells, el análisis de SOLID y Clean Code, el diseño de los casos de prueba y la escritura del código de la suite `pagos.test.mjs`, la propuesta del código de los refactorings R-1 a R-4 y de la corrección F-1, y la organización de la documentación técnica.

**Grado de utilización:** Alto. La herramienta propuso y redactó los cambios, las pruebas y la documentación.

Cada cambio se aplicó en el repositorio en un commit propio, se ejecutó la suite de pruebas antes y después, y se verificó que el comportamiento se mantuviera. La corrección F-1 se hizo en un commit separado por modificar el comportamiento. Los defectos de roles se confirmaron además con el autor del módulo de cuentas.

**Evidencia:** Las conversaciones completas se encuentran en el ZIP anexo.

**Responsabilidad:** La selección de los cambios incorporados, su ejecución y la verificación de los resultados estuvieron a mi cargo.