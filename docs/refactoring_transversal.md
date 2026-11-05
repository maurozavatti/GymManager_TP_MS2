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

### 1.3 Verificación inicial

Antes de realizar modificaciones en el código, se instalaron las dependencias del backend mediante `npm ci` y se ejecutó `npm test` para comprobar el funcionamiento de las pruebas existentes.

La compilación de TypeScript finalizó correctamente y se ejecutaron las 8 pruebas del archivo `permisos.test.mjs`, con los siguientes resultados:

- Pruebas ejecutadas: 8.
- Pruebas aprobadas: 8.
- Pruebas fallidas: 0.
- Pruebas pendientes: 0.

La instalación de dependencias también informó 0 vulnerabilidades conocidas.

Estos resultados se tomarán como referencia para las próximas modificaciones. Las pruebas actuales cubren distintos casos de autenticación y autorización, pero todavía será necesario revisar la cobertura de las utilidades HTTP y del manejo de errores.

Las modificaciones se documentarán y guardarán en commits individuales para que sea más sencillo revisar los cambios e integrarlos posteriormente.