# Changelog

## 0.3.0

- Add direct crown/root interaction zones to the existing anatomical tooth
  artwork without rendering a second tooth image.
- Persist crown/root conditions in `anatomyState` while accepting older
  snapshots that omit the field.
- Include anatomy state in undo, reset, JSON export, missing-tooth and implant
  conflict handling.

## 0.2.4

- Make multi-tooth selection the default interaction and remove the separate
  multi-select mode control.
- Preserve the current tooth group when editing an individual surface.

## 0.2.3

- Make embedded layouts respond to their host container width so the chart and
  inspector do not overlap inside sidebars or constrained application shells.

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
