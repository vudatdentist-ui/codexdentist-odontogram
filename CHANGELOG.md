# Changelog

## 0.7.0

- Reorder the treatment workflow to initial condition, current condition, then
  expected result.
- Add compact multi-selection actions to deselect all teeth or clear every
  condition attached to the selected teeth.
- Add explicit, confirmed actions to clear the active stage or all three
  treatment stages.
- Keep clear operations undoable inside an active chart and include preserved
  extension entries in clear and undo behavior.

## 0.6.0

- Restrict the surface color toolbar to caries, fillings, and inlay/onlay.
- Make direct crown/root interaction select a clinical target without painting
  the anatomical illustration.
- Add a crown/root-aware caries clinical marker rendered on the current tooth
  contour.
- Continue accepting legacy planned, watch, and anatomical color entries
  without exposing those retired controls.

## 0.5.1

- Restore pointer interaction on the SVG crown/root map so direct mouse and
  touch selection reaches the anatomically clipped regions.

## 0.5.0

- Add the extensible `version: 2` entry model with automatic migration from
  legacy surface, anatomy, marker, bridge, and quick-diagnosis snapshots.
- Turn crown/root selection into a clinical target that filters compatible
  symbols and records root versus crown fractures independently.
- Replace the occlusion-only dialog with a general assessment for gingiva,
  calculus, plaque, oral hygiene, occlusion, arch findings, and short notes.
- Preserve unknown structurally valid entries for forward-compatible
  integrations.

## 0.4.0

- Add the standalone treatment stages `Hiện trạng ban đầu`,
  `Kết quả kỳ vọng`, and `Tiến độ hiện tại`.
- Persist the three snapshots independently and migrate the previous
  single-chart browser data into the initial and current stages.
- Extend iframe events with `stage` and `stages` while preserving the legacy
  active snapshot in `data`.

## 0.3.3

- Rename the quick inter-arch diagnosis control to `Khớp cắn` so the label
  matches the occlusal relationship data it records.

## 0.3.2

- Allow an empty tooth selection on initial load, after switching dentition,
  and when the last selected tooth is clicked again.
- Disable tooth-specific clinical markers and bridges until at least one tooth
  is selected instead of silently targeting a fallback tooth.

## 0.3.1

- Align crown/root fills, hover targets, and outlines to the exact source tooth
  contour and SVG viewBox for every supported tooth template.
- Use the dedicated primary-tooth contour instead of reusing the permanent
  tooth silhouette.

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
