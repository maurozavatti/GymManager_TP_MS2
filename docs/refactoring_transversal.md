# Análisis y refactorización de componentes transversales

**Trabajo Práctico Integrador — Metodología de Sistemas II**

**Sistema:** Gym Manager  
**Integrante responsable:** Emanuel Aaron Brahim Pollini  
**Rama de trabajo:** `refactor/transversal`

## 1. Objetivo y alcance

Este trabajo se enfoca en revisar y mejorar algunos componentes del backend de Gym Manager que son utilizados por distintas partes del sistema, como la gestión de permisos, las utilidades HTTP y el manejo de errores en los controladores.

Se busca detectar problemas en el código, aplicar principios SOLID y buenas prácticas de Clean Code, realizar las refactorizaciones necesarias y comprobar mediante pruebas que los cambios no afecten el funcionamiento del sistema.

### 1.1 Archivos principales

- `backend/src/servicios/permisos.ts`
- `backend/src/compartidos/http.ts`
- Controladores que tengan código repetido relacionado con el manejo de errores.

### 1.2 Entorno de trabajo

Para realizar el trabajo se clonó el repositorio grupal `GymManager_TP_MS2` y se creó la rama `refactor/transversal`. De esta manera, los cambios pueden desarrollarse por separado sin afectar directamente la rama principal (`main`).

Las modificaciones se documentarán y guardarán en commits individuales para que sea más sencillo revisar los cambios e integrarlos posteriormente.

### 1.3 Verificación inicial

Antes de realizar modificaciones en el código, se instalaron las dependencias del backend mediante `npm ci` y se ejecutó `npm test` para comprobar el funcionamiento de las pruebas existentes.

La compilación de TypeScript finalizó correctamente y se ejecutaron las 8 pruebas del archivo `permisos.test.mjs`, con los siguientes resultados:

- Pruebas ejecutadas: 8.
- Pruebas aprobadas: 8.
- Pruebas fallidas: 0.
- Pruebas pendientes: 0.

La instalación de dependencias también informó 0 vulnerabilidades conocidas.

Estos resultados se tomarán como referencia para las próximas modificaciones. Las pruebas actuales cubren distintos casos de autenticación y autorización, pero todavía será necesario revisar la cobertura de las utilidades HTTP y del manejo de errores.

## 2. Diagnóstico de calidad interna

### 2.1 Code smells detectados

#### S-T01 — Manejo de errores duplicado

**Tipo:** Duplicación de código.

**Ubicación:** `backend/src/controladores/pagos.ts` (líneas 111–117) y `backend/src/controladores/turnos.ts` (líneas 309–315), tomando como referencia el estado inicial del proyecto.

**Evidencia:** Ambos controladores utilizan bloques `catch` muy similares para responder a errores HTTP conocidos y errores inesperados.

**Impacto:** Si necesitamos cambiar la forma de manejar los errores, tenemos que modificar varios archivos que repiten la misma lógica.

**Riesgo:** Los controladores podrían terminar respondiendo de manera diferente ante errores similares si se modifica uno y se olvida actualizar los demás.

**Prioridad:** Media.

**Mejora propuesta:** Evaluar la posibilidad de centralizar el manejo común de errores en una función reutilizable, conservando las respuestas actuales del sistema.

#### S-T02 — Errores inesperados sin registrar

**Tipo:** Manejo inadecuado de excepciones.

**Ubicación:** `backend/src/controladores/turnos.ts` (líneas 309–315) y `backend/src/controladores/pagos.ts` (líneas 111–117), tomando como referencia el estado inicial del proyecto.

**Evidencia:** Cuando ocurre un error inesperado, los controladores devuelven una respuesta HTTP 500 con un mensaje genérico, pero no registran el error original.

**Impacto:** Si ocurre un problema durante una operación, resulta más difícil identificar qué lo provocó.

**Riesgo:** Los errores podrían repetirse sin contar con información suficiente para investigar su causa.

**Prioridad:** Alta.

**Mejora propuesta:** Centralizar el manejo de errores y registrar los errores inesperados de forma controlada, manteniendo las respuestas actuales y evitando mostrar información técnica sensible al usuario.

#### S-T03 — Responsabilidades mezcladas en http.ts

**Tipo:** Baja cohesión y responsabilidades mezcladas.

**Ubicación:** `backend/src/compartidos/http.ts` (líneas 1–54 y 57–86), tomando como referencia el estado inicial del proyecto.

**Evidencia:** El archivo contiene funciones relacionadas con las solicitudes y respuestas HTTP (`responder`, `leerJSON` y `ErrorHTTP`), pero también incluye validaciones de campos (`texto`, `entero`, `identificador` y `fechaArgentina`). Incluso importa `ObjectId` de MongoDB.

**Impacto:** El archivo reúne funciones con distintos propósitos, lo que dificulta mantener una separación clara de responsabilidades.

**Riesgo:** Al agregar nuevas validaciones o modificar las existentes, el archivo podría seguir creciendo y mezclar aún más responsabilidades.

**Prioridad:** Media.

**Mejora propuesta:** Evaluar la separación de las funciones de validación en un módulo específico, manteniendo en `http.ts` las funciones relacionadas directamente con HTTP y conservando el comportamiento actual.

#### S-T04 — Validaciones de roles inconsistentes

**Tipo:** Duplicación de lógica de autorización y uso inconsistente de funciones compartidas.

**Ubicación:** `backend/src/controladores/clientes.ts` y `backend/src/controladores/resumen.ts`, en las comparaciones directas de `personal.rol`. También se presenta en otros controladores del sistema.

**Evidencia:** Aunque `permisos.ts` ya proporciona la función `tieneRol`, algunos controladores siguen comparando directamente el rol del usuario con textos como `'ADMIN'` o `'ENTRENADOR'`. Estas comparaciones no funcionan correctamente cuando los roles están almacenados como una lista.

**Impacto:** Las cuentas con permisos válidos pueden ser rechazadas por el sistema. Además, algunas condiciones utilizadas para restringir información pueden dejar de funcionar como se espera.

**Riesgo:** Se pueden producir errores de autorización o permitir que un usuario acceda a información que no le corresponde.

**Prioridad:** Alta.

**Mejora propuesta:** Utilizar de manera consistente la función `tieneRol` para comprobar los permisos, evitando duplicar las comparaciones de roles en los controladores.

## 3. Análisis de SOLID y Clean Code

### 3.1 Relación con los problemas detectados

A partir del diagnóstico realizado, se identificaron oportunidades de mejora relacionadas con los principios SOLID y las buenas prácticas de Clean Code.

**S-T01 — Manejo de errores duplicado (DRY)**

La repetición de bloques `catch` en distintos controladores va en contra del principio DRY (*Don't Repeat Yourself*). Centralizar el manejo común de errores permitiría reducir la duplicación y facilitar el mantenimiento.

**S-T02 — Errores inesperados sin registrar (Clean Code)**

Los controladores devuelven mensajes genéricos cuando ocurre un error inesperado, pero no registran su causa. Incorporar un registro controlado de estos errores facilitaría el diagnóstico de fallas, sin exponer información técnica sensible al usuario.

**S-T03 — Responsabilidades mezcladas en http.ts (SRP)**

El archivo `http.ts` reúne funciones HTTP y validaciones de distintos tipos de datos. Separar estas responsabilidades permitiría mejorar la cohesión del código y facilitar modificaciones futuras, siguiendo el principio de responsabilidad única (SRP).

**S-T04 — Validaciones de roles inconsistentes (DRY y reutilización)**

Aunque `permisos.ts` ya proporciona la función `tieneRol`, algunos controladores realizan comprobaciones directas de roles. Reutilizar la función existente permitiría mantener un criterio de autorización consistente y evitar la duplicación de reglas.

### 3.2 Objetivo de las mejoras

Las mejoras propuestas buscan reducir la duplicación de código, separar responsabilidades y facilitar el mantenimiento del backend.

Antes de aplicar los refactorings se prepararán pruebas de caracterización para comprobar el comportamiento actual. Después de cada modificación se volverán a ejecutar las pruebas para verificar que las funcionalidades existentes sigan funcionando correctamente.

## 4. Pruebas de caracterización

### 4.1. Pruebas antes del refactoring

Antes de modificar el código, se incorporó el archivo `backend/pruebas/http.test.mjs` para verificar el comportamiento actual de las funciones de `http.ts`.

Se agregaron 8 pruebas que comprueban:

- La información almacenada en `ErrorHTTP`.
- El estado y el formato JSON de las respuestas generadas por `responder`.
- La lectura de JSON válido y el rechazo de contenido incorrecto en `leerJSON`.
- Las validaciones realizadas por `texto`, `entero`, `identificador` y `fechaArgentina`.

También se actualizó el comando `npm test` para ejecutar estas pruebas junto con las 8 pruebas existentes de permisos.

**Resultado:** 16 pruebas aprobadas, ninguna fallida y compilación de TypeScript sin errores.

Estas pruebas servirán para comprobar que los cambios posteriores no alteren el comportamiento esperado.

**Evidencias:**
- `evidencias/refactor_transversal/pruebas_http_antes.txt`
- `evidencias/refactor_transversal/pruebas_http_antes.png`

### 4.2. Pruebas del manejo de errores

Se incorporó `backend/pruebas/errores.test.mjs` para verificar cómo responde el sistema ante errores conocidos e inesperados.

Se agregaron 2 pruebas sobre el controlador de resumen:

- Sin una sesión válida, devuelve un error 401.
- Ante una falla interna, devuelve un error 500 sin exponer detalles técnicos al usuario.

Las pruebas utilizan dependencias simuladas, por lo que no requieren conexión a MongoDB.

También se actualizó `npm test` para incluir este archivo.

**Resultado:** 18 pruebas aprobadas, ninguna fallida y compilación de TypeScript sin errores.

Estas pruebas permitirán verificar que el refactoring del manejo de errores mantenga las respuestas esperadas. El registro de errores internos se incorporará como parte de la mejora S-T02.

**Evidencias:**
- `evidencias/refactor_transversal/pruebas_errores_antes.txt`
- `evidencias/refactor_transversal/pruebas_errores_antes.png`

## 5. Refactorings y correcciones realizadas

### 5.1. R-T01 — Separación de responsabilidades en http.ts (S-T03)

**Problema detectado:**
El archivo `http.ts` concentraba funciones HTTP, validaciones de datos y la definición de `ErrorHTTP`, mezclando responsabilidades diferentes.

**Refactoring aplicado:**
Se reorganizó el código en tres archivos:

- `errores.ts`: contiene la clase `ErrorHTTP`.
- `validaciones.ts`: contiene `texto`, `entero`, `identificador` y `fechaArgentina`.
- `http.ts`: conserva `responder` y `leerJSON`, además de las exportaciones necesarias para mantener la compatibilidad con los controladores existentes.

Las funciones se trasladaron sin modificar su comportamiento.

**Mejora obtenida:**
Se separaron responsabilidades siguiendo el principio SRP de SOLID. Esto facilita el mantenimiento y permite modificar las validaciones sin intervenir directamente en las funciones HTTP.

**Verificación:**
Después del refactoring se ejecutó `npm test`, con 18 pruebas aprobadas, ninguna fallida y compilación de TypeScript sin errores.

**Evidencias:**
- Antes: `evidencias/refactor_transversal/pruebas_http_antes.txt`
- Después: `evidencias/refactor_transversal/pruebas_http_despues.txt`
- Captura: `evidencias/refactor_transversal/pruebas_http_despues.png`

**Commit del refactoring:** `6619987` — `refactor: separar validaciones y errores de http`.

### 5.2. R-T02 — Centralización del manejo de errores (S-T01 y S-T02)

**Problema detectado:**
Los controladores repetían bloques `catch` con lógica similar para responder ante excepciones. Además, los errores inesperados devolvían un código 500 sin registrar la causa original, lo que dificultaba identificar problemas durante el mantenimiento.

**Refactoring aplicado:**
Se creó `backend/src/compartidos/manejo_errores.ts`, con la función `manejarError`, que centraliza el tratamiento de excepciones.

La función distingue entre:

- Errores HTTP conocidos: conserva el código de estado, mensaje y campos.
- Errores inesperados: registra el error original mediante `console.error` y devuelve una respuesta 500 con un mensaje genérico.

Como primera aplicación, se reemplazó el bloque `catch` de `backend/src/controladores/resumen.ts` por una llamada a `manejarError`.

**Mejora obtenida:**
Se redujo la duplicación de lógica en el controlador modificado y se incorporó el registro de errores inesperados sin exponer información interna al usuario.

**Verificación:**
Se agregó una prueba que inicialmente fallaba porque el controlador no registraba los errores inesperados.

Después de aplicar el cambio, se ejecutó `npm test` con 19 pruebas aprobadas, ninguna fallida y compilación de TypeScript sin errores. Las pruebas utilizan dependencias simuladas y no requieren conexión a MongoDB.

**Estado:**
S-T01 y S-T02 fueron abordados inicialmente en `resumen.ts` y posteriormente en `pagos.ts`, como se documenta en la sección 6.3. El manejo centralizado de errores ya funciona en ambos controladores. Queda pendiente revisar su aplicación en otros módulos, especialmente Turnos, durante la integración grupal.

**Evidencias:**
- `evidencias/refactor_transversal/pruebas_errores_antes.txt`
- `evidencias/refactor_transversal/pruebas_manejo_errores_despues.txt`
- `evidencias/refactor_transversal/pruebas_manejo_errores_despues.png`

**Commit del refactoring:** `fbc0489` — `refactor: centralizar manejo de errores en resumen`.

### 5.3. F-T01 — Corrección de permisos con roles múltiples (S-T04)

**Problema detectado:**
El controlador `resumen.ts` comparaba directamente el rol del usuario con `ADMIN` y `ENTRENADOR`. Esto provocaba errores de autorización cuando una cuenta tenía varios roles almacenados en un arreglo.

**Corrección aplicada:**
Se reemplazaron las comparaciones directas por llamadas a `tieneRol`, función que ya existía en `permisos.ts`.

Se modificaron tres aspectos:

- La validación de acceso al resumen.
- La autorización para consultar indicadores administrativos.
- El filtrado de turnos para entrenadores sin permisos de administrador.

De esta manera, una cuenta con varios roles puede utilizar los permisos que realmente tiene, sin permitir que un entrenador acceda a turnos ajenos.

**Mejora obtenida:**
Se unificó el criterio de autorización, evitando comparaciones inconsistentes y mejorando la seguridad del controlador.

**Verificación:**
Se incorporaron pruebas para comprobar el comportamiento con varios roles.

Antes de la corrección, una prueba fallaba porque una cuenta con roles `ENTRENADOR` y `ADMIN` recibía 403 en lugar de 200.

Después del cambio, las 22 pruebas existentes pasaron correctamente. Finalmente, se agregó una prueba para verificar que un entrenador con varios roles solamente pueda consultar sus propios turnos.

**Resultado final:** 23 pruebas aprobadas, ninguna fallida y compilación de TypeScript sin errores.

Las pruebas utilizan dependencias simuladas y no requieren conexión a MongoDB.

**Estado:**
S-T04 corregido en `resumen.ts`. Las autorizaciones de los demás controladores deberán verificarse durante la integración grupal.

**Evidencias:**
- `evidencias/refactor_transversal/pruebas_roles_antes.txt`
- `evidencias/refactor_transversal/pruebas_roles_antes.png`
- `evidencias/refactor_transversal/pruebas_roles_despues.txt`
- `evidencias/refactor_transversal/pruebas_roles_despues.png`
- `evidencias/refactor_transversal/pruebas_roles_final.txt`
- `evidencias/refactor_transversal/pruebas_roles_final.png`

**Commit de la corrección funcional:** `7e2a358` — `fix: corregir permisos con roles multiples en resumen`.

## 6. Integración con el módulo de Pagos

### 6.1. Integración de ramas

El 06/11/2026 se incorporaron a `refactor/transversal` los cambios del módulo de Pagos previamente fusionados en `main`.

**Commit de integración:** `f682fc6`

Durante la integración se identificó un conflicto en `backend/package.json`, ya que ambas ramas habían modificado el script `npm test`.

Se resolvió conservando las cuatro suites de pruebas:

- `permisos.test.mjs`
- `http.test.mjs`
- `errores.test.mjs`
- `pagos.test.mjs`

No fue necesario modificar la lógica de negocio de Pagos ni los refactorings realizados por Mauro.

### 6.2. Verificación de integración

Después de resolver el conflicto, se ejecutó `npm test` para comprobar la compatibilidad entre ambos trabajos.

**Resultados:**

- Compilación TypeScript: correcta.
- Pruebas ejecutadas: 36.
- Pruebas aprobadas: 36.
- Pruebas fallidas: 0.

**Evidencias:**

- `evidencias/refactor_transversal/pruebas_integracion_pagos_36.txt`
- `evidencias/refactor_transversal/pruebas_integracion_pagos_36.png`

### 6.3. R-T04 — Centralización del manejo de errores en Pagos (S-P3 y S-P9)

**Problemas detectados:**

Durante la integración con el módulo de Pagos se identificaron dos problemas:

- **S-P3:** los errores inesperados devolvían HTTP 500, pero no se registraban en el servidor.
- **S-P9:** el controlador `pagos.ts` repetía la lógica de manejo de errores HTTP que ya había sido centralizada en `manejo_errores.ts`.

**Prueba antes del cambio:**

Se incorporó una prueba en `backend/pruebas/errores.test.mjs` para simular un error inesperado en el controlador de Pagos.

La prueba verificó que:
- La respuesta utilizara el estado HTTP 500.
- El cliente recibiera un mensaje genérico, sin información interna.
- El error original quedara registrado mediante `console.error`.

Antes de la corrección, la última comprobación falló porque el controlador no registraba el error.

**Resultado inicial:**
- 37 pruebas ejecutadas.
- 36 aprobadas.
- 1 fallida (esperada).

**Refactoring aplicado:**

En `backend/src/controladores/pagos.ts` se reemplazó el bloque `catch` repetido por una llamada a la función compartida `manejarError(respuesta, error)`.

La función, definida en `backend/src/compartidos/manejo_errores.ts`, centraliza el tratamiento de las excepciones HTTP y registra los errores inesperados.

El cambio permitió eliminar código duplicado y mantener un criterio uniforme para responder ante errores.

No se modificaron las reglas de negocio, las operaciones de Pagos ni los refactorings previamente desarrollados por Mauro.

**Pruebas después del cambio:**

Se ejecutó nuevamente `npm test`, incluyendo las suites de Permisos, HTTP, Errores y Pagos.

**Resultado final:**
- Compilación TypeScript correcta.
- 37 pruebas ejecutadas.
- 37 aprobadas.
- 0 fallidas.

La nueva prueba confirmó que los errores inesperados se registran sin revelar sus detalles al cliente. Las pruebas existentes continuaron pasando.

**Evidencias:**

Antes:
- `evidencias/refactor_transversal/pruebas_pagos_errores_antes.txt`
- `evidencias/refactor_transversal/pruebas_pagos_errores_antes.png`

Después:
- `evidencias/refactor_transversal/pruebas_pagos_errores_despues.txt`
- `evidencias/refactor_transversal/pruebas_pagos_errores_despues.png`

**Estado:** S-P3 y S-P9 corregidos en el controlador de Pagos.

**Commit del refactoring:** `6600a07` — `refactor: centralizar manejo de errores en pagos (S-P3 y S-P9)`.

### 6.4. Alcance de las mejoras transversales y pendientes de integración

Durante el trabajo se desarrolló la función compartida `manejarError`, destinada a centralizar las respuestas ante errores HTTP conocidos e inesperados.

**Controladores adaptados y verificados:**

- `resumen.ts`: centralización del manejo de errores y registro de errores inesperados.
- `pagos.ts`: aplicación de R-T04, corrigiendo S-P3 y S-P9.

Ambos controladores cuentan con pruebas que verifican el tratamiento de errores inesperados.

**Revisión de los demás controladores:**

Se identificaron bloques de manejo de errores que todavía no utilizan la función compartida en:

- `turnos.ts`
- `clientes.ts`
- `login.ts`
- `register.ts`
- `cuenta.ts`
- `cuentas.ts`
- `sesion.ts`

Algunos de estos controladores tienen tratamientos particulares para errores de validación, conflictos de MongoDB o mensajes específicos. Por lo tanto, su adaptación requiere pruebas de caracterización para conservar las respuestas existentes.

También se revisaron tratamientos específicos de excepciones en componentes de infraestructura, como el servidor, la conexión a MongoDB y el servicio de archivos. No se consideran reemplazos directos del manejador HTTP compartido.

**Pendientes de autorización:**

Durante la revisión también se observaron comprobaciones directas de roles en `clientes.ts` y `turnos.ts`.

Estas comprobaciones deben revisarse para admitir correctamente las cuentas con múltiples roles. En Turnos es especialmente importante verificar las restricciones de acceso a turnos propios.

**Estado de integración:**

Las mejoras desarrolladas en los controladores Resumen y Pagos están implementadas y verificadas.

La adaptación de los demás controladores y las correcciones de autorización pendientes deberán coordinarse durante la integración grupal, respetando las responsabilidades de cada integrante.

No se considera que estos problemas estén corregidos hasta incorporar los cambios correspondientes y comprobarlos mediante pruebas.

## 7. Resumen de pruebas antes y después

Durante el trabajo se ejecutaron pruebas de caracterización y regresión antes y después de las modificaciones, con el objetivo de identificar defectos y comprobar que los cambios no afectaran las funcionalidades existentes.

| Etapa | Pruebas aprobadas | Pruebas fallidas | Resultado |
|---|---:|---:|---|
| Estado inicial | 8 | 0 | Pruebas originales de permisos |
| Caracterización HTTP | 16 | 0 | Nuevas pruebas de utilidades HTTP |
| Caracterización de errores | 18 | 0 | Comportamiento previo verificado |
| R-T01: separación de responsabilidades | 18 | 0 | Sin regresiones |
| R-T02: manejo centralizado de errores | 19 | 0 | Registro de errores verificado |
| F-T01: roles múltiples | 23 | 0 | Corrección y pruebas de seguridad |
| Integración con Pagos | 36 | 0 | Compatibilidad entre ramas |
| S-P3: prueba antes de corregir | 36 | 1 | Defecto reproducido |
| R-T04: corrección de S-P3 y S-P9 | 37 | 0 | Corrección verificada |

La cantidad de pruebas fue aumentando a medida que se incorporaron nuevos casos de caracterización y regresión.

Los fallos provocados intencionalmente antes de las correcciones permitieron demostrar los problemas originales. Después de aplicar los cambios, las pruebas correspondientes finalizaron correctamente.

Las pruebas utilizan dependencias simuladas y no requieren una conexión activa a MongoDB.

**Resultado final:** 37 pruebas aprobadas, ninguna fallida y compilación de TypeScript correcta.

Las evidencias de cada etapa se encuentran en `evidencias/refactor_transversal/` y están referenciadas en las secciones anteriores.

## 8. Conclusión individual

Mi participación en este trabajo se centró en mejorar componentes transversales del backend de Gym Manager, principalmente las utilidades HTTP, la gestión de permisos y el manejo de errores.

El análisis permitió identificar problemas de duplicación de código, responsabilidades mezcladas y validaciones de roles inconsistentes. A partir de estos problemas se aplicaron refactorings orientados a mejorar la organización del código, facilitar su mantenimiento y reutilizar funcionalidades compartidas.

Uno de los cambios más importantes fue la centralización del manejo de errores, que permitió reducir la duplicación en los controladores intervenidos y registrar los errores inesperados sin exponer información interna al usuario.

También se corrigió un problema funcional relacionado con cuentas que poseen varios roles, incorporando pruebas para comprobar tanto el acceso autorizado como las restricciones de seguridad.

La integración con el trabajo de Pagos permitió comprobar la compatibilidad de los refactorings realizados por distintos integrantes del equipo.

Considero que el principal aprendizaje fue comprender la importancia de realizar cambios pequeños, respaldados por pruebas y commits individuales. Esto permitió detectar errores, verificar cada modificación y facilitar la integración del trabajo grupal.

El resultado fue una mejora de la calidad interna del código, manteniendo las funcionalidades existentes y corrigiendo los defectos identificados en los componentes intervenidos.

## 9. Declaración individual de uso de inteligencia artificial

**Herramienta utilizada:** ChatGPT, de OpenAI.

**Propósito:** Se utilizó como herramienta de asistencia durante el análisis de código, la identificación de posibles code smells, la planificación de refactorings, la elaboración de pruebas, la interpretación de errores de ejecución y la organización de la documentación técnica.

**Grado de utilización:** La herramienta colaboró mediante explicaciones, propuestas de código, ejemplos de pruebas y sugerencias de mejora.

Las propuestas fueron revisadas y adaptadas al proyecto. Las modificaciones se incorporaron de manera incremental y se comprobaron mediante la compilación del backend, la ejecución de pruebas y la revisión de los resultados obtenidos.

También se utilizó como apoyo para resolver conflictos de integración entre ramas Git y documentar los cambios realizados.

**Responsabilidad:** La selección de los cambios incorporados, su ejecución, las verificaciones y las decisiones finales sobre el trabajo estuvieron a mi cargo.

El uso de inteligencia artificial se considera una asistencia al proceso de desarrollo y aprendizaje, no un reemplazo de la comprensión ni de la validación del código.
