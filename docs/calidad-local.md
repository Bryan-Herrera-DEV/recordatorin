# Calidad Local Y SonarQube

Este proyecto puede validar localmente antes de cada push con:

- TypeScript typecheck.
- Oxlint.
- `npm audit`.
- SonarQube local via Docker.

## Levantar SonarQube Local

Necesitas Docker Desktop o Docker Engine.

Arranca SonarQube:

```bash
npm run sonar:up
```

Abre:

```text
http://localhost:9000
```

Credenciales iniciales normales de SonarQube:

```text
usuario: admin
password: admin
```

SonarQube pedira cambiar la contrasena.

## Crear Token

1. Entra a SonarQube.
2. Ve a tu perfil.
3. Abre `Security`.
4. Crea un token.
5. Exportalo como `SONAR_TOKEN`.

PowerShell:

```powershell
$env:SONAR_TOKEN="tu-token"
npm run sonar:scan
```

Bash:

```bash
export SONAR_TOKEN="tu-token"
npm run sonar:scan
```

Si usas otro host:

```bash
SONAR_HOST_URL=http://localhost:9000 npm run sonar:scan
```

## Validacion Manual Completa

```bash
npm run validate
npm run sonar:scan
```

`npm run validate` ejecuta:

- `npm run typecheck`
- `npm run lint`
- `npm run audit`

## Pre-push Automatico

Activa los hooks del repo:

```bash
npm run setup:hooks
```

Desde ese momento, cada `git push` ejecuta:

```bash
npm run validate:prepush
```

Eso corre:

- Typecheck.
- Oxlint.
- Audit con severidad alta.
- SonarQube local.

Si quieres saltarte Sonar temporalmente, no uses el hook y corre manualmente:

```bash
npm run validate
```

Para apagar SonarQube:

```bash
npm run sonar:down
```
