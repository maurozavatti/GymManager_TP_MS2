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