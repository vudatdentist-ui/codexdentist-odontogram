# Changelog

## 0.2.2

- Emit `onChange` only when the clinical snapshot actually changes, including
  under React Strict Mode.

## 0.2.1

- Add `embedded` mode for use inside an existing application shell.
- Avoid emitting `onChange` before the user changes the chart.

## 0.2.0

- Add controlled and uncontrolled tooth selection APIs.
- Add `readOnly` mode for clinical records and consultation views.
- Document the integration props used by host applications.

## 0.1.0

- Initial standalone React component and Vite demo.
- Add clinical markers, five surfaces, bridges, bone loss, quick diagnosis,
  local demo persistence, JSON export, and iframe messaging.
