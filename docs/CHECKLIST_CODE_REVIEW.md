# Checklist de Code Review — Gym Manager

**Materia:** Metodología de Sistemas II  
**Proyecto:** Gym Manager  
**Fecha:** 07/11/2026  
**Integrantes:** Mauro Zavatti, Fernando Aguillón y Emanuel Pollini

## 1. Objetivo

Registrar los criterios utilizados para revisar los cambios realizados en el TPI y las observaciones que surgieron durante la integración de las ramas.

Las revisiones se hicieron mediante Pull Requests en GitHub. Este documento reúne los criterios técnicos y los resultados de esas revisiones.

## 2. Checklist técnico

| Criterio | Estado | Observación |
|---|---|---|
| Los cambios tienen un objetivo claro | Cumple | Cada integrante trabajó en un módulo o componente definido. |
| Se identificaron los problemas antes de modificarlos | Cumple | Se documentaron code smells y problemas de calidad interna. |
| Los refactorings están separados en commits | Cumple | Los cambios principales tienen commits identificables. |
| Se aplicaron principios SOLID y Clean Code | Cumple en los componentes intervenidos | Se mejoraron responsabilidades, funciones y manejo de errores. |
| Se conservaron las funcionalidades existentes | Verificado mediante pruebas | Se ejecutaron pruebas de regresión y caracterización. |
| Las correcciones funcionales se distinguieron de los refactorings | Cumple | Los problemas de autorización se registraron mediante commits de tipo `fix`. |
| Se realizaron pruebas antes y después | Cumple | Hay evidencias correspondientes a los tres trabajos. |
| Se documentaron los cambios | Cumple | Documentación en el repositorio y en el informe grupal. |
| Se registraron observaciones durante la revisión | Cumple | Hay comentarios y aprobaciones en los Pull Requests. |
| Se identificaron mejoras pendientes | Cumple | Se documentaron limitaciones y problemas no abordados. |

## 3. Revisiones realizadas

### PR #1 — Pagos (Mauro)

**Revisores:** Emanuel y Fernando.

Se revisaron los refactorings del módulo de Pagos, sus commits y las pruebas. Ambos integrantes aprobaron la integración.

Como observación, quedó identificado el manejo repetido de errores S-P9, que posteriormente se abordó como parte del trabajo transversal.

**Resultado:** aprobado e integrado a `main`.

[Ver PR #1](https://github.com/maurozavatti/GymManager_TP_MS2/pull/1)

### PR #2 — Componentes transversales (Emanuel)

**Revisores:** Mauro y Fernando.

Se revisaron las mejoras en utilidades HTTP, permisos y manejo de errores, junto con sus pruebas y documentación.

Los revisores dejaron comentarios favorables y el PR fue integrado.

**Resultado:** aprobado e integrado a `main`.

[Ver PR #2](https://github.com/maurozavatti/GymManager_TP_MS2/pull/2)

### PR #3 — Turnos (Fernando)

**Revisores:** Emanuel y Mauro.

Se revisaron las correcciones de permisos, la centralización del manejo de errores y la extracción de la validación de franjas horarias.

Durante la revisión se señaló que faltaban las evidencias de pruebas antes y después. Fernando las agregó en el commit `6ecba89` y posteriormente se confirmó la aprobación.

**Resultado:** aprobado e integrado a `main`.

[Ver PR #3](https://github.com/maurozavatti/GymManager_TP_MS2/pull/3)

## 4. Verificación final

Luego de integrar las tres ramas, se ejecutó `npm test` sobre `main`.

| Resultado | Cantidad |
|---|---:|
| Pruebas ejecutadas | 45 |
| Pruebas aprobadas | 45 |
| Pruebas fallidas | 0 |

La compilación de TypeScript también terminó correctamente.

**Evidencia:** `evidencias/integracion_final/pruebas_finales_main.txt`

Estas pruebas verifican los casos automatizados existentes. No representan una validación completa de todas las operaciones posibles del sistema.

## 5. Criterios de aceptación y conclusión

Para considerar aceptable cada conjunto de cambios, se revisó que tuviera un objetivo claro, no introdujera regresiones en las pruebas disponibles y contara con documentación y evidencias.

Los tres Pull Requests fueron aprobados e integrados. La observación sobre las evidencias de Turnos fue atendida antes de su fusión.

Quedaron identificadas mejoras futuras en otros controladores y casos de autorización que no formaron parte del alcance de los refactorings realizados.

La revisión cruzada permitió detectar aspectos pendientes, comprobar el trabajo de los compañeros y mantener un historial de los cambios y decisiones tomadas.
