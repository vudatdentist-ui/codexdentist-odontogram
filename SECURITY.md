# Security policy

## Reporting

Use GitHub's private security advisory feature for vulnerabilities. Do not open
a public issue containing patient data, credentials, exploit details, or private
deployment information.

## Integration boundary

This repository provides UI state and generated tooth assets. It does not
provide authentication, authorization, tenant isolation, audit logging, or
server-side patient storage. Integrators are responsible for enforcing those
controls in their own API.

For iframe integrations:

- Restrict `frame-ancestors` to known parent applications.
- Pass an exact `parentOrigin`.
- Verify `event.origin` before reading or writing odontogram data.
- Never use `"*"` as the target origin for patient data.
