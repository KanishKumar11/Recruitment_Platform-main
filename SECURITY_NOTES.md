Security notes for dependencies

- 'react-quill' and 'quill' were removed as they were unused in the codebase. This removes a moderate XSS vulnerability flagged by npm audit.

 - 'xlsx' (SheetJS) previously had advisories (Prototype Pollution & ReDoS, no fix available at the time). I replaced it with `exceljs` in the codebase and updated download code to use `exceljs`.
  - Current Risk: None reported by `npm audit` after replacement. The project now uses `exceljs` to generate Excel files (client-side) in the following files:
    - src/app/dashboard/recruiter/jobs/[id]/resumes/page.tsx
    - src/app/dashboard/company/jobs/[id]/resumes/page.tsx
    - src/app/dashboard/internal/jobs/[id]/resumes/page.tsx
  - Recommendations:
    1. Continue to use `xlsx` if you only write/produce client-side XLSX output, but avoid parsing or reading untrusted Excel files with this library.
    2. Consider switching to a safer alternative (e.g., `exceljs`) if you must parse files or if you want to remove the audit warning.
    3. Monitor https://github.com/SheetJS/sheetjs/releases and update `xlsx` as soon as a fix is published.

- Quick mitigation actions taken:
  1. Removed `react-quill` and `quill` from `package.json` and uninstalled them.
  2. Replaced `xlsx` with `exceljs` and updated the Excel generation code accordingly.
  3. Reinstalled dependencies and validated with `npm run build` to ensure no runtime or compile issues.

If you'd like, I can also add a CI check to fail builds on new critical/high vulnerabilities or expand tests for the new `exceljs` implementation.