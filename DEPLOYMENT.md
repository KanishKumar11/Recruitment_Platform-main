Deployment notes for Recruitment Platform

Environment requirements:
- Node 20+ (or configured in your environment)
- npm 10+ recommended

To avoid ERESOLVE peer dependency errors on the server (for example when running `npm ci` in CI/CD):
- Add a `.npmrc` in the project root with the following content:

```
legacy-peer-deps=true
```

This setting mirrors passing `--legacy-peer-deps` to npm and prevents ERESOLVE peer dependency conflicts from failing the install, which is useful when using newer React versions (eg., React 19) and older peer-dep packages.

Alternative: Set the environment variable in your CI pipeline like this:
- Bash: `export NPM_CONFIG_LEGACY_PEER_DEPS=true`
- PowerShell: `$env:NPM_CONFIG_LEGACY_PEER_DEPS = 'true'`

Security note:
- We removed `react-quill` and `quill` to reduce audit noise. The only remaining flagged package before replacement was `xlsx`; it has been replaced with `exceljs` to eliminate SheetJS advisories and reduce attack surface where we generate client-side XLSX.

If you prefer to keep stricter peer dependency checks in CI, you can remove `.npmrc` and add `--legacy-peer-deps` manually to the `npm install` commands in your CI config.
