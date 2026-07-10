# Releases de Recordatorin

Esta guia explica como crear releases locales, publicar releases en GitHub, subir versiones `patch`, `minor` y `major`, generar instaladores para Windows/Linux y reducir avisos de Microsoft SmartScreen.

## Versionado SemVer

Recordatorin usa versionado semantico: `MAJOR.MINOR.PATCH`.

Ejemplos:

- `patch`: `1.0.0` a `1.0.1`. Correcciones pequenas, bugs, ajustes visuales sin romper compatibilidad.
- `minor`: `1.0.1` a `1.1.0`. Features nuevas compatibles, por ejemplo nuevos temas o sonidos.
- `major`: `1.1.0` a `2.0.0`. Cambios grandes o incompatibles, migraciones importantes o cambios de comportamiento.

## Release Rapido Desde GitHub

Este es el flujo recomendado.

1. Ve a GitHub Actions.
2. Abre el workflow `Release`.
3. Pulsa `Run workflow`.
4. Elige `patch`, `minor` o `major`.
5. Ejecuta el workflow.

El workflow hace automaticamente:

- Actualiza la version en `package.json` y `package-lock.json`.
- Crea un commit `chore(release): vX.Y.Z`.
- Crea el tag `vX.Y.Z`.
- Compila Windows en `windows-latest` y Linux en `ubuntu-latest`.
- Sube el `.exe` de Windows y el `.AppImage` de Linux a GitHub Releases.

El build de Windows debe correr en `windows-latest` porque la app usa `better-sqlite3`, una dependencia nativa. Si el `.exe` se genera desde Linux, el instalador puede terminar correctamente pero la app puede cerrarse al arrancar.

## Ejemplos De Subida

Para corregir un bug y pasar de `1.0.0` a `1.0.1`, elige `patch` en el workflow.

Para agregar una feature compatible y pasar de `1.0.1` a `1.1.0`, elige `minor`.

Para una version grande y pasar de `1.1.0` a `2.0.0`, elige `major`.

## Release Local Manual

Instala dependencias:

```bash
npm ci
```

Valida antes de versionar:

```bash
npm run typecheck
npm run lint
npm run audit
npm run build
```

Sube un patch local:

```bash
npm run version:patch
VERSION=$(node -p "require('./package.json').version")
git add package.json package-lock.json
git commit -m "chore(release): v$VERSION"
git tag "v$VERSION"
git push origin main --follow-tags
```

Sube un minor local:

```bash
npm run version:minor
VERSION=$(node -p "require('./package.json').version")
git add package.json package-lock.json
git commit -m "chore(release): v$VERSION"
git tag "v$VERSION"
git push origin main --follow-tags
```

Sube un major local:

```bash
npm run version:major
VERSION=$(node -p "require('./package.json').version")
git add package.json package-lock.json
git commit -m "chore(release): v$VERSION"
git tag "v$VERSION"
git push origin main --follow-tags
```

Al empujar el tag `vX.Y.Z`, GitHub Actions publica el release automaticamente.

## Builds Locales

Build de la app sin instalador:

```bash
npm run build
```

Instalador Windows:

```bash
npm run dist:win
```

AppImage Linux:

```bash
npm run dist:linux
```

Los artefactos quedan en `release/`.

Si Windows bloquea `release/win-unpacked` con `EPERM`, cierra cualquier `Recordatorin.exe` abierto, cierra exploradores apuntando a `release/` y elimina la carpeta `release/` antes de repetir.
