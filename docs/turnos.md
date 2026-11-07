# Resumen del trabajo – Refactorización del controlador de turnos

## 1. Información general

- **Proyecto:** GymManager – Metodología de Sistemas II.
- **Integrante:** Integrante B.
- **Rama de trabajo:** `feature/turnos`.
- **Archivo principal modificado:** `backend/src/controladores/turnos.ts`.
- **Archivo de pruebas:** `backend/pruebas/turnos.test.mjs`.
- **Carpeta de evidencias:** `evidencias/turnos/`.

El objetivo del trabajo fue corregir problemas detectados en el controlador de turnos y mejorar la calidad del código mediante técnicas de refactorización, manteniendo su comportamiento funcional.

---

## 2. Diagnóstico inicial

Se identificaron distintos code smells en el controlador de turnos:

| ID | Code smell | Ubicación aproximada | Problema detectado |
|---|---|---|---|
| CT-01 | Long Method | `generarAgenda()` | Acumulaba validaciones, generación de turnos y persistencia. |
| CT-02 | Long Parameter List | `crearOEditarTurno()` | Recibía cinco parámetros, dificultando su comprensión y mantenimiento. |
| CT-03 | Complex Conditional | `generarAgenda()` | La condición `conservaApertura` combinaba múltiples verificaciones. |
| CT-04 | Nested Loops | `generarAgenda()` | Presentaba varios niveles de iteración anidados. |
| CT-05 | Magic Numbers | Varias funciones | Utilizaba valores numéricos sin constantes descriptivas. |
| CT-06 | Duplicated Logic | Validaciones de roles | Repetía comparaciones directas de roles. |
| CT-07 | Duplicated Error Handling | `gestionarTurnos()` | Repetía la lógica de manejo de errores. |
| CT-08 | Large Method / Mixed Responsibilities | `gestionarTurnos()` | Concentraba autenticación, autorización, conexión y enrutamiento. |

Estos problemas afectaban principalmente la legibilidad, el mantenimiento, la reutilización y la posibilidad de extender el controlador.

---

## 3. Corrección de permisos por múltiples roles

### Problema detectado

El sistema permitía que una cuenta tuviera más de un rol, almacenados como una lista. Sin embargo, algunas verificaciones del controlador comparaban el rol directamente con una cadena de texto.

Por ejemplo:

`personal.rol === 'ADMIN'`

Esta comparación no funcionaba cuando el rol estaba representado como `['ADMIN']`, provocando respuestas HTTP 403 incluso para usuarios autorizados.

### Solución implementada

Se incorporó la función compartida `tieneRol()`:

`import { tieneRol } from '../servicios/permisos.ts'`

Se reemplazaron las comparaciones directas por verificaciones compatibles con uno o varios roles.

También se revisaron las restricciones de acceso de los entrenadores para asegurar que solamente pudieran administrar sus propios turnos.

### Resultado

- Se reconocen correctamente los usuarios con múltiples roles.
- Se mantienen las restricciones de acceso.
- Los entrenadores no pueden modificar turnos ajenos.
- Se evita rechazar usuarios legítimos por el formato de almacenamiento de sus roles.

**Commit:** `3a8c3bf` – `fix(turnos): corregir permisos para usuarios con multiples roles`

---

## 4. Refactorización del manejo de errores

### Code smell: Duplicated Logic

La función `gestionarTurnos()` contenía un bloque `catch` que diferenciaba errores HTTP de errores inesperados y construía manualmente las respuestas.

Esta lógica ya existía en el módulo compartido `manejo_errores.ts`, por lo que mantenerla duplicada dificultaba el mantenimiento.

### Solución implementada

Se incorporó el módulo compartido:

`import { manejarError } from '../compartidos/manejo_errores.ts'`

El bloque original fue reemplazado por:

```ts
} catch (error) {
    manejarError(respuesta, error)
}
```

### Resultado

- Se centralizó el manejo de errores.
- Se eliminó lógica duplicada.
- Se mantuvieron las respuestas HTTP existentes.
- Los errores inesperados se registran internamente sin exponer detalles técnicos al usuario.

**Commit:** `baaf7fe` – `refactor(turnos): centralizar manejo de errores`

---

## 5. Refactorización mediante Extract Method

### Code smell: Long Method

La función `generarAgenda()` realizaba múltiples tareas. Entre ellas, validaba las franjas horarias de apertura, verificaba superposiciones y posteriormente generaba los turnos.

La validación de franjas constituía una responsabilidad independiente que podía separarse.

### Solución implementada

Se creó la función:

`validarFranjas(valores: unknown)`

Esta función se encarga de:

1. Verificar que se haya indicado entre una y cuatro franjas.
2. Comprobar que cada franja tenga el formato esperado.
3. Validar los horarios de inicio y finalización.
4. Verificar que cada franja tenga una duración en horas enteras.
5. Ordenar las franjas cronológicamente.
6. Rechazar franjas horarias superpuestas.

La función devuelve las franjas validadas y ordenadas.

En `generarAgenda()` se reemplazó el bloque original por:

```ts
const capacidad = entero(datos.capacidad, 'capacidad', 1, 100)
const franjas = validarFranjas(datos.franjas)
```

### Resultado

- Se redujo la cantidad de responsabilidades de `generarAgenda()`.
- Se aisló la validación de horarios.
- Se mejoró la legibilidad.
- Se facilitó el mantenimiento y la reutilización de la lógica.
- Se conservó el comportamiento original.

**Técnica aplicada:** Extract Method.

**Commit:** `af5e5f6` – `refactor(turnos): extraer validacion de franjas`

---

## 6. Pruebas de caracterización

Se trabajó con pruebas automatizadas en `pruebas/turnos.test.mjs`, utilizando Node.js Test Runner y dependencias simuladas para evitar depender de una base de datos real.

Se verificaron los siguientes escenarios:

- Rechazo de solicitudes sin sesión.
- Permisos de los entrenadores sobre sus propios turnos.
- Restricción para modificar turnos de otros entrenadores.
- Acceso correcto con roles almacenados como listas.
- Rechazo de usuarios sin permisos.
- Respuesta HTTP 500 ante errores inesperados, sin exponer información interna.
- Rechazo de agendas con franjas horarias superpuestas.

### Resultado de las pruebas

| Etapa | Tests aprobados | Tests fallidos |
|---|---:|---:|
| Línea base inicial | 37 | 0 |
| Caracterización de turnos antes de corregir permisos | 42 | 1 |
| Después de corregir permisos | 43 | 0 |
| Antes de centralizar errores | 44 | 0 |
| Después de centralizar errores | 44 | 0 |
| Antes de extraer `validarFranjas()` | 45 | 0 |
| Después de extraer `validarFranjas()` | 45 | 0 |

La prueba que inicialmente fallaba permitió identificar el problema de comparación de roles y comprobar su corrección.

Los mensajes de errores internos que aparecen durante algunas ejecuciones son intencionales: corresponden a pruebas que verifican el registro de errores inesperados.

---

## 7. Evidencias

Se creó la carpeta `evidencias/turnos/` para conservar los registros del proceso de trabajo.

Se incluyeron evidencias de:

- Pruebas anteriores y posteriores a las correcciones.
- Problemas relacionados con los roles.
- Centralización del manejo de errores.
- Extracción de la validación de franjas.
- Resultados de las pruebas automatizadas.

Los archivos de evidencia se incorporaron al repositorio mediante un commit independiente.

---

## 8. Historial de commits

Los cambios se realizaron en la rama `feature/turnos`, sin modificar directamente `main`.

| Hash | Commit | Descripción |
|---|---|---|
| `3a8c3bf` | fix(turnos): corregir permisos para usuarios con multiples roles | Corrección de permisos. |
| `baaf7fe` | refactor(turnos): centralizar manejo de errores | Eliminación de lógica duplicada. |
| `af5e5f6` | refactor(turnos): extraer validacion de franjas | Aplicación de Extract Method. |
| `6ecba89` | docs(turnos): agregar evidencias de pruebas y refactorizaciones | Incorporación de evidencias. |

---

## 9. Estado final

Al finalizar el trabajo:

- Se corrigieron los problemas de autorización relacionados con múltiples roles.
- Se centralizó el manejo de errores.
- Se aplicó la técnica Extract Method.
- Se incorporaron pruebas de caracterización.
- La compilación TypeScript finalizó correctamente.
- Se obtuvieron 45 pruebas aprobadas y 0 fallidas.
- Se registraron cuatro commits en la rama `feature/turnos`.
- Se incorporaron las evidencias al repositorio.

Los cambios quedaron preparados para su revisión por parte de los demás integrantes y posterior integración con `main` mediante un Pull Request.

---

## 10. Conclusión

El trabajo realizado permitió mejorar la calidad del controlador de turnos, solucionando un problema funcional relacionado con los permisos y aplicando técnicas de refactorización para reducir la duplicación y separar responsabilidades.

La incorporación de pruebas de caracterización permitió verificar que los cambios no alteraran el comportamiento esperado del sistema. Además, el uso de commits independientes facilitó el seguimiento de las modificaciones y su posterior revisión por parte del equipo.

---

## 11. Declaración de uso de Inteligencia Artificial

Durante el desarrollo de este trabajo práctico se utilizó ChatGPT como herramienta de apoyo para resolver dudas técnicas, comprender los problemas detectados en el código y analizar posibles soluciones de refactorización.

Su utilización fue principalmente como asistencia durante el proceso de desarrollo. Se consultó para:

- Comprender el funcionamiento del controlador de turnos y sus responsabilidades.
- Identificar y analizar posibles *code smells*.
- Comprender los errores relacionados con la validación de roles y permisos.
- Evaluar alternativas para centralizar el manejo de errores.
- Aplicar la técnica de refactorización *Extract Method*.
- Elaborar y revisar pruebas automatizadas de caracterización.
- Interpretar los resultados obtenidos al ejecutar las pruebas.
- Comprender el funcionamiento de Git, los commits y el proceso de publicación de la rama de trabajo.

Las sugerencias proporcionadas por la herramienta fueron revisadas y aplicadas durante el desarrollo, verificando los cambios mediante la compilación del proyecto y la ejecución de las pruebas automatizadas.

La herramienta se utilizó como recurso de consulta y aprendizaje, mientras que las modificaciones, verificaciones y decisiones finales fueron realizadas por el integrante responsable del módulo.

**Herramienta utilizada:** ChatGPT (OpenAI).

En conclusión, se logró mejorar la mantenibilidad, legibilidad y confiabilidad del módulo de turnos, manteniendo su funcionamiento y respetando la estrategia de trabajo mediante ramas independientes.
