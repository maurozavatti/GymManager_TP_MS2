# Gym Manager — TPI Metodología de Sistemas II

Trabajo Práctico Integrador de **Metodología de Sistemas II**, correspondiente a la **Tecnicatura Universitaria en Programación (UTN)**.

## Descripción del proyecto

Gym Manager es un sistema de gestión de gimnasios desarrollado originalmente como parte del Trabajo Final Integrador de la carrera. Permite administrar clientes, turnos de entrenamiento, pagos y cuentas de usuario, con diferentes permisos para administradores, entrenadores y clientes.

Para este TPI tomamos una versión existente del **backend** y trabajamos sobre su calidad interna. El objetivo no fue incorporar nuevas funcionalidades, sino detectar problemas en el código, aplicar refactorings, corregir defectos puntuales y comprobar los cambios mediante pruebas.

El análisis se concentró principalmente en **Pagos**, **Turnos** y los componentes compartidos de **permisos, HTTP y manejo de errores**.

Este repositorio contiene el backend utilizado para el trabajo y las evidencias de la refactorización; no incluye el frontend completo del proyecto original.

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

Se identificaron problemas de duplicación de código, responsabilidades mezcladas, métodos extensos y comprobaciones de permisos inconsistentes.

Algunos afectaban principalmente la mantenibilidad; otros también producían errores visibles, como respuestas HTTP `403` para cuentas que tenían roles válidos almacenados en listas.

Las principales mejoras fueron:

| Área | Cambios realizados |
|---|---|
| **Pagos** | Refactorings para separar responsabilidades, simplificar la lógica y mejorar la organización del controlador; corrección de permisos con roles múltiples. |
| **Turnos** | Corrección de validaciones de roles, centralización de errores y extracción de la función `validarFranjas()` mediante Extract Method. |
| **Componentes transversales** | Separación de validaciones y errores de `http.ts`; creación de `manejo_errores.ts`; aplicación del manejador compartido en Resumen, Pagos y Turnos; corrección de permisos en Resumen. |

Los refactorings y las correcciones funcionales se documentaron por separado, permitiendo distinguir las mejoras estructurales de las modificaciones destinadas a solucionar defectos existentes.

Las mejoras no abarcan todos los controladores. La deuda técnica pendiente se encuentra identificada en la documentación.

## Estructura del repositorio

A continuación se muestran las carpetas y archivos principales del repositorio. Los directorios de evidencias contienen los registros originales de pruebas y capturas correspondientes a las distintas etapas del trabajo.

```text
GymManager_TP_MS2/
│
├── README.md
├── .gitignore
│
├── backend/
│   ├── .env.ejemplo
│   ├── README.md
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   │
│   ├── src/
│   │   ├── server.ts
│   │   ├── db.ts
│   │   ├── check-connection.ts
│   │   │
│   │   ├── compartidos/
│   │   │   ├── errores.ts
│   │   │   ├── http.ts
│   │   │   ├── manejo_errores.ts
│   │   │   ├── modelos.ts
│   │   │   ├── reglas.ts
│   │   │   └── validaciones.ts
│   │   │
│   │   ├── controladores/
│   │   │   ├── clientes.ts
│   │   │   ├── cuenta.ts
│   │   │   ├── cuentas.ts
│   │   │   ├── login.ts
│   │   │   ├── pagos.ts
│   │   │   ├── register.ts
│   │   │   ├── resumen.ts
│   │   │   ├── sesion.ts
│   │   │   └── turnos.ts
│   │   │
│   │   └── servicios/
│   │       ├── archivos.ts
│   │       ├── autenticacion.ts
│   │       ├── contrasenas.ts
│   │       ├── pagos.ts
│   │       ├── permisos.ts
│   │       └── roles.ts
│   │
│   └── pruebas/
│       ├── errores.test.mjs
│       ├── http.test.mjs
│       ├── pagos.test.mjs
│       ├── permisos.test.mjs
│       └── turnos.test.mjs
│
├── docs/
│   ├── CHECKLIST_CODE_REVIEW.md
│   ├── pagos.md
│   ├── refactoring_transversal.md
│   └── turnos.md
│
└── evidencias/
    ├── integracion_final/
    │   ├── pruebas_finales_main.png
    │   └── pruebas_finales_main.txt
    │
    ├── refactor_transversal/
    │   └── Registros TXT y capturas PNG de las pruebas
    │
    ├── turnos/
    │   └── Registros TXT del antes y después
    │
    ├── tests-estado-inicial.txt
    ├── tests-pagos-antes.txt
    └── tests-pagos-despues.txt
```

### Organización principal

- `backend/src/`: código fuente del sistema.
- `backend/pruebas/`: pruebas automatizadas de caracterización y verificación.
- `backend/.env.ejemplo`: plantilla de configuración de las variables de entorno, sin credenciales reales.
- `docs/`: diagnóstico, decisiones técnicas, documentación de los refactorings y checklist de code review.
- `evidencias/`: registros y capturas de las pruebas realizadas antes y después de los cambios.
- `README.md`: descripción general, instalación, uso, pruebas y referencias de la entrega.

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

Para iniciar el servidor, crear un archivo **`backend/.env`**, utilizando como referencia el archivo `.env.ejemplo` incluido en el repositorio:

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
npm run check
npm run check:db
```

- `npm run check`: verifica tipos sin generar archivos.
- `npm run check:db`: compila y comprueba la conexión a MongoDB mediante ping.

## Pruebas y verificación

Para ejecutar las pruebas automatizadas, desde la carpeta `backend/`:

```bash
npm test
```

El comando compila TypeScript y ejecuta las cinco suites:

- Permisos.
- HTTP.
- Errores.
- Pagos.
- Turnos.

Las pruebas utilizan dependencias simuladas para verificar las operaciones sin requerir una conexión real a MongoDB Atlas.

**Resultado documentado de la verificación grupal final en `main`:**

| Resultado | Cantidad |
|---|---:|
| Pruebas ejecutadas | 45 |
| Pruebas aprobadas | 45 |
| Pruebas fallidas | 0 |

Evidencias:

- [Registro de pruebas finales](evidencias/integracion_final/pruebas_finales_main.txt)
- [Captura de pruebas finales](evidencias/integracion_final/pruebas_finales_main.png)

Algunas pruebas simulan errores internos que aparecen en la consola; forman parte de la verificación del manejo de excepciones y no representan fallas de la suite.

Estas pruebas permiten verificar los escenarios automatizados cubiertos, pero no constituyen una validación integral del sistema con frontend y base de datos real.

## Documentación y evidencias

La documentación se encuentra organizada según las responsabilidades de los integrantes y las etapas del TPI.

### Documentación técnica

- [Análisis y refactorización de Pagos](docs/pagos.md): diagnóstico de code smells, análisis de SOLID y Clean Code, refactorings aplicados, correcciones de permisos, pruebas y evidencias del módulo.
- [Refactoring de componentes transversales](docs/refactoring_transversal.md): diagnóstico, separación de responsabilidades, manejo compartido de errores, permisos, pruebas y trazabilidad de los cambios.
- [Refactoring del controlador de Turnos](docs/turnos.md): diagnóstico, correcciones de permisos, centralización de errores, Extract Method, pruebas, evidencias y declaración de uso de IA.
- [Checklist de code review](docs/CHECKLIST_CODE_REVIEW.md): criterios técnicos de revisión, observaciones, correcciones y resultados de los Pull Requests.

### Evidencias

- [Estado inicial del sistema](evidencias/tests-estado-inicial.txt).
- [Pruebas de Pagos antes del refactoring](evidencias/tests-pagos-antes.txt).
- [Pruebas de Pagos después del refactoring](evidencias/tests-pagos-despues.txt).
- [Evidencias de Turnos](evidencias/turnos/).
- [Evidencias de componentes transversales](evidencias/refactor_transversal/).
- [Evidencias de integración final](evidencias/integracion_final/).

El informe PDF grupal reúne el diagnóstico general, los refactorings de los tres integrantes, la comparación antes/después, la revisión técnica, las conclusiones y la declaración de uso de herramientas de inteligencia artificial.

## Revisión de código

Los cambios se desarrollaron en ramas individuales y se revisaron entre los integrantes antes de fusionarlos con `main`:

- [PR #1 — Pagos](https://github.com/maurozavatti/GymManager_TP_MS2/pull/1)
- [PR #2 — Componentes transversales](https://github.com/maurozavatti/GymManager_TP_MS2/pull/2)
- [PR #3 — Turnos](https://github.com/maurozavatti/GymManager_TP_MS2/pull/3)

Los tres Pull Requests fueron revisados, aprobados e integrados.

Durante las revisiones se comprobaron los cambios, se analizaron las pruebas y se registraron observaciones.

En el PR #3, por ejemplo, se solicitó completar las evidencias de pruebas antes y después, que fueron incorporadas antes de la integración.

Los criterios de revisión, las observaciones, el feedback y las correcciones realizadas se encuentran documentados en el [Checklist de code review](docs/CHECKLIST_CODE_REVIEW.md).

## Versiones y tags

La consigna del TPI solicita identificar la versión inicial, la versión refactorizada y los principales hitos mediante tags.

Se utilizaron las siguientes etiquetas:

| Tag | Descripción |
|---|---|
| `estado-inicial` | Versión base del sistema antes de las mejoras del TPI. |
| `etapa-diagnostico` | Diagnóstico de calidad y análisis técnico. |
| `etapa-refactoring` | Integración de los cambios de refactorización. |
| `etapa-pruebas` | Registro de las pruebas finales. |
| `etapa-docs` | Documentación y checklist de revisión. |
| `estadorefactorizado` | Versión refactorizada y documentada del sistema. |

Los tags permiten consultar los commits que representan cada etapa del trabajo.

[Consultar los tags del repositorio](https://github.com/maurozavatti/GymManager_TP_MS2/tags).

## Video de presentación

**Video grupal de defensa y demostración:**

[Ver presentación del TPI Gym Manager en YouTube](https://youtu.be/k9XeIAVtE3A)

**Duración total:** 12 minutos y 42 segundos.

En el video participan los tres integrantes con su propia voz, presentando el sistema base, los problemas encontrados, los principales code smells, los refactorings aplicados, las pruebas antes y después, el proceso de code review y las conclusiones del equipo.

La presentación está distribuida según las responsabilidades de cada integrante:

- **Emanuel Aaron Brahim Pollini:** sistema base, calidad interna y externa, diagnóstico general, componentes transversales y pruebas.
- **Mauro Alberto Zavatti:** diagnóstico, refactorings y pruebas del módulo de Pagos.
- **Fernando Joaquín Aguillón Basabilbaso:** módulo de Turnos, integración final, code review y conclusiones.

## Entrega

La entrega del Trabajo Práctico Integrador de Metodología de Sistemas II se compone de:

- **Informe PDF grupal:** análisis de calidad, code smells, refactorings, pruebas, code review, uso de IA y conclusiones.
- **Repositorio GitHub:** código del sistema, historial de commits, tags, Pull Requests y documentación técnica.
- **Anexo ZIP:** evidencias complementarias, capturas, registros y documentación adicional.
- **Video grupal:** [Presentación del TPI Gym Manager](https://youtu.be/k9XeIAVtE3A).

Estos recursos conforman la entrega solicitada por la cátedra para evaluar el proceso de diagnóstico, mejora y verificación de la calidad del software.