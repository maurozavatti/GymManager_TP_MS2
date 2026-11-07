# Gym Manager — TPI Metodología de Sistemas II

Trabajo Práctico Integrador de **Metodología de Sistemas II**, correspondiente a la **Tecnicatura Universitaria en Programación (UTN)**.

## Descripción del proyecto

Gym Manager es un sistema de gestión de gimnasios desarrollado originalmente como parte del Trabajo Final Integrador de la carrera. Permite administrar clientes, turnos de entrenamiento, pagos y cuentas de usuario, con diferentes permisos para administradores, entrenadores y clientes.

Para este TPI tomamos una versión existente del **backend** y trabajamos sobre su calidad interna. El objetivo no fue incorporar nuevas funcionalidades, sino detectar problemas en el código, aplicar refactorings, corregir defectos puntuales y comprobar los cambios mediante pruebas.

El análisis se concentró principalmente en **Pagos**, **Turnos** y los componentes compartidos de **permisos, HTTP y manejo de errores**. Este repositorio contiene el backend utilizado para el trabajo y las evidencias de la refactorización; no incluye el frontend completo del proyecto original.

## Integrantes y distribución del trabajo

| Integrante | Trabajo principal |
|---|---|
| **Mauro Alberto Zavatti** | Diagnóstico y refactorings del módulo de Pagos. |
| **Fernando Joaquín Aguillón Basabilbaso** | Correcciones y refactorings del módulo de Turnos. |
| **Emanuel Aaron Brahim Pollini** | Componentes transversales: utilidades HTTP, permisos y manejo de errores. |

Los cambios se desarrollaron en ramas separadas y se revisaron mediante Pull Requests antes de integrarlos a `main`.

## Tecnologías

- **Backend:** Node.js y TypeScript.
- **Servidor HTTP:** módulo nativo `node:http`.
- **Base de datos:** MongoDB Atlas (driver oficial de MongoDB).
- **Autenticación:** sesiones y comprobación de roles.
- **Pruebas:** Node.js Test Runner (`node:test`) y dependencias simuladas.
- **Control de versiones y revisión:** Git y GitHub.

## Funcionalidades principales del sistema base

- Gestión de clientes y cuentas de usuario.
- Inicio y cierre de sesión, con permisos según el rol.
- Gestión de turnos: consulta, creación, modificación, asignación de clientes y generación de agenda.
- Gestión de pagos: registro, consulta y cambio de estado de pagos.
- Consulta de indicadores mediante el resumen administrativo.

## Diagnóstico y cambios realizados

Se identificaron problemas de duplicación de código, responsabilidades mezcladas, métodos extensos y comprobaciones de permisos inconsistentes. Algunos afectaban principalmente la mantenibilidad; otros también producían errores visibles, como respuestas `403` para cuentas que tenían roles válidos almacenados en listas.

Las principales mejoras fueron:

| Área | Cambios realizados |
|---|---|
| **Pagos** | Refactorings para separar responsabilidades, simplificar la lógica y mejorar la organización del controlador; corrección de permisos con roles múltiples. |
| **Turnos** | Corrección de validaciones de roles, centralización de errores y extracción de la función `validarFranjas()` mediante **Extract Method**. |
| **Componentes transversales** | Separación de las validaciones y errores de `http.ts`; creación de `manejo_errores.ts`; aplicación del manejador en Resumen y Pagos; corrección de permisos en Resumen. |

Los refactorings y las correcciones funcionales se documentaron por separado. Las mejoras no abarcan todos los controladores: los pendientes identificados se explican en la documentación técnica.

## Estructura del repositorio

```text
GymManager_TP_MS2/
├── backend/
│   ├── src/
│   │   ├── compartidos/
│   │   ├── controladores/
│   │   └── servicios/
│   ├── pruebas/
│   ├── package.json
│   └── tsconfig.json
├── docs/
│   ├── refactoring_transversal.md
│   └── turnos.md
├── evidencias/
│   ├── refactor_transversal/
│   ├── turnos/
│   ├── integracion_final/
│   ├── tests-pagos-antes.txt
│   └── tests-pagos-despues.txt
└── README.md
```

## Instalación y ejecución

### Requisitos

- Node.js actualizado, compatible con la opción `--env-file-if-exists`.
- npm.
- Acceso a una base de datos MongoDB para ejecutar el backend con persistencia.

### Preparación

Desde una terminal:

```bash
git clone https://github.com/maurozavatti/GymManager_TP_MS2.git
cd GymManager_TP_MS2/backend
npm ci
```

Para iniciar el servidor, crear un archivo **`backend/.env`** con los datos correspondientes al entorno:

```dotenv
MONGODB_URI=<cadena_de_conexion_de_MongoDB>
MONGODB_DB=<nombre_de_la_base_de_datos>
PORT=3000
```

> El archivo `.env` está excluido de Git. No subir credenciales reales al repositorio.

Compilar y ejecutar:

```bash
npm run build
npm start
```

Con el servidor en funcionamiento, se puede comprobar el estado básico de la API en `http://localhost:3000/api/salud` (o en el puerto configurado).

El backend también contempla servir archivos de un frontend compilado desde `frontend/dist`, pero esa carpeta no forma parte de este repositorio del TPI.

### Otros comandos

```bash
npm run check       # Verifica tipos sin generar archivos
npm run check:db    # Compila y comprueba la conexión a MongoDB mediante ping
```

## Pruebas y verificación

Para ejecutar las pruebas automatizadas:

```bash
cd backend
npm test
```

El comando compila TypeScript y ejecuta las suites de **Permisos, HTTP, Errores, Pagos y Turnos**. Las pruebas usan dependencias simuladas para verificar las operaciones sin requerir una conexión real a MongoDB Atlas.

**Resultado de la última verificación grupal en `main`: 45 pruebas aprobadas, 0 fallidas.**

- [Registro de pruebas finales](evidencias/integracion_final/pruebas_finales_main.txt)
- [Captura de pruebas finales](evidencias/integracion_final/pruebas_finales_main.png)

Algunas pruebas simulan errores internos que aparecen en la consola; forman parte de la verificación del manejo de excepciones y no representan fallas de la suite.

## Documentación y evidencias

- [Refactoring de componentes transversales](docs/refactoring_transversal.md): diagnóstico, SOLID/Clean Code, cambios, pruebas y pendientes de integración.
- [Refactoring del controlador de Turnos](docs/turnos.md): diagnóstico, correcciones, Extract Method, pruebas y evidencias.
- [Evidencias de Pagos](evidencias/): archivos `tests-pagos-antes.txt` y `tests-pagos-despues.txt`.
- [Evidencias de Turnos](evidencias/turnos/).
- [Evidencias del trabajo transversal](evidencias/refactor_transversal/).
- [Evidencias de integración final](evidencias/integracion_final/).

El informe PDF grupal reúne el diagnóstico general, los refactorings de los tres integrantes, la comparación antes/después, la revisión técnica, las conclusiones y la declaración de uso de herramientas de IA.

## Revisión de código

Los cambios se trabajaron en ramas individuales y se revisaron entre los integrantes antes de fusionarlos con `main`:

- [PR #1 — Pagos](https://github.com/maurozavatti/GymManager_TP_MS2/pull/1)
- [PR #2 — Componentes transversales](https://github.com/maurozavatti/GymManager_TP_MS2/pull/2)
- [PR #3 — Turnos](https://github.com/maurozavatti/GymManager_TP_MS2/pull/3)

Las observaciones, correcciones y aprobaciones pueden consultarse en esos Pull Requests. **Pendiente de cierre:** incorporar el checklist técnico grupal en `docs/`, con criterios de revisión y aceptación, tal como pide la consigna.

## Versiones y tags

La consigna del TPI solicita identificar la versión inicial, la versión refactorizada y los hitos principales mediante estos tags:

- `estado-inicial`
- `etapa-diagnostico`
- `etapa-pruebas`
- `etapa-refactoring`
- `etapa-docs`
- `estadorefactorizado`

Los tags permiten consultar los commits que representan cada etapa del trabajo. Se pueden consultar en la [sección Tags del repositorio](https://github.com/maurozavatti/GymManager_TP_MS2/tags).

## Video de presentación

**Enlace al video grupal:** **[PENDIENTE: agregar el enlace cuando esté disponible]**.

En el video se presentarán el sistema base, los problemas encontrados, los principales refactorings, las pruebas y las conclusiones del equipo.

## Entrega

La entrega del TPI se completa con el **informe PDF**, este **repositorio GitHub**, el **anexo ZIP de evidencias** y el **video grupal**, según lo indicado por la cátedra.
