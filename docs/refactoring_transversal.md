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

## 5. Refactorings realizados

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
- Antes: `evidencias/refactor_transversal/pruebas_errores_antes.txt`
- Después: `evidencias/refactor_transversal/pruebas_http_despues.txt`
- Captura: `evidencias/refactor_transversal/pruebas_http_despues.png`