# Recordatorin

App local-first de notas y recordatorios creada con Electron, React, TypeScript, Tailwind CSS y componentes estilo shadcn.

## Funcionalidad

- Onboarding local con nombre del usuario.
- Notas con título, fechas de creación/modificación, Markdown completo y lienzo Excalidraw.
- Carpetas y tags para organizar notas y recordatorios.
- Búsqueda y filtros por texto, carpeta, tag y fecha.
- Recordatorios una vez, periódicos, diarios, semanales y aleatorios.
- Notificaciones en segundo plano mediante Electron Tray.
- Persistencia local en SQLite nativo con `better-sqlite3`.
- Temas altamente personalizables: colores, fuentes, radios, blur y densidad.
- i18n en español e inglés.
- Sonidos suaves de UI y alertas con preset o audio personalizado.

## Comandos

```bash
npm run dev
npm run typecheck
npm run lint
npm run build
npm run dist
npm run rebuild:native
```

## Arquitectura

- `electron/`: proceso principal, preload seguro, SQLite y scheduler de notificaciones.
- `src/app`: bootstrap, rutas, layout y store global Zustand.
- `src/features`: vertical slices por dominio (`notes`, `reminders`, `settings`, `workspace`).
- `src/shared`: value objects, tipos compartidos y UI base.
- `src/platform`: adaptadores de almacenamiento, tema, sonido e IPC.

## Calidad

- TypeScript estricto sin `any` explícitos en `src` ni `electron`.
- `sonar-project.properties` incluido para análisis SonarQube.
- `oxlint` configurado para código fuente y excluyendo artefactos generados.
- `npm audit --omit=dev` queda en 0 vulnerabilidades con overrides controlados.
