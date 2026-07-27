"use client";

import {
  Check,
  Clipboard,
  ClipboardList,
  Download,
  RotateCcw,
  Undo2,
  X,
} from "lucide-react";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  GeneralAssessmentScope,
  GeneralAssessmentState,
  LegacyOdontogramData,
  OdontogramData,
  OdontogramDataInput,
  OdontogramEntry,
  OdontogramEntryKind,
  OdontogramEntryStatus,
  OdontogramRegion,
} from "./data-model";
import styles from "./odontogram.module.css";

const adultUpperTeeth = [
  "18", "17", "16", "15", "14", "13", "12", "11",
  "21", "22", "23", "24", "25", "26", "27", "28",
] as const;

const adultLowerTeeth = [
  "48", "47", "46", "45", "44", "43", "42", "41",
  "31", "32", "33", "34", "35", "36", "37", "38",
] as const;

const primaryUpperTeeth = [
  "55", "54", "53", "52", "51", "61", "62", "63", "64", "65",
] as const;

const primaryLowerTeeth = [
  "85", "84", "83", "82", "81", "71", "72", "73", "74", "75",
] as const;

const allTeeth = [
  ...adultUpperTeeth,
  ...adultLowerTeeth,
  ...primaryUpperTeeth,
  ...primaryLowerTeeth,
] as const;

const conditionOptions = [
  {
    id: "caries",
    label: "Sâu răng",
    shortLabel: "Sâu",
    color: "#d64045",
    conceptId: "caries",
    kind: "condition",
    status: "observed",
  },
  {
    id: "existing",
    label: "Phục hồi hiện có",
    shortLabel: "Hiện có",
    color: "#2878b5",
    conceptId: "restoration",
    kind: "restoration",
    status: "existing",
  },
  {
    id: "planned",
    label: "Điều trị dự kiến",
    shortLabel: "Dự kiến",
    color: "#d18a12",
    conceptId: "treatment",
    kind: "procedure",
    status: "planned",
  },
  {
    id: "watch",
    label: "Theo dõi",
    shortLabel: "Theo dõi",
    color: "#14866d",
    conceptId: "watch",
    kind: "condition",
    status: "monitoring",
  },
] as const;

const clinicalMarkerOptions = [
  {
    id: "pulpitis",
    label: "Viêm tủy",
    shortLabel: "VT",
    color: "#d64045",
    targets: ["tooth"],
    defaultTarget: "tooth",
    kind: "condition",
    status: "observed",
  },
  {
    id: "periodontitis",
    label: "Viêm quanh răng",
    shortLabel: "QR",
    color: "#c0363c",
    targets: ["tooth"],
    defaultTarget: "tooth",
    kind: "condition",
    status: "observed",
  },
  {
    id: "boneLoss",
    label: "Tiêu xương",
    shortLabel: "TX",
    color: "#b65b36",
    targets: ["tooth"],
    defaultTarget: "tooth",
    kind: "condition",
    status: "observed",
  },
  {
    id: "periapical",
    label: "Tổn thương quanh chóp",
    shortLabel: "QC",
    color: "#b8323a",
    targets: ["root"],
    defaultTarget: "root",
    kind: "condition",
    status: "observed",
  },
  {
    id: "implant",
    label: "Implant",
    shortLabel: "IM",
    color: "#2878b5",
    targets: ["tooth"],
    defaultTarget: "tooth",
    kind: "prosthesis",
    status: "existing",
  },
  {
    id: "rootCanal",
    label: "Đã điều trị tủy",
    shortLabel: "TT",
    color: "#7256a8",
    targets: ["root"],
    defaultTarget: "root",
    kind: "procedure",
    status: "existing",
  },
  {
    id: "crown",
    label: "Mão răng",
    shortLabel: "MR",
    color: "#d18a12",
    targets: ["crown"],
    defaultTarget: "crown",
    kind: "prosthesis",
    status: "existing",
  },
  {
    id: "missing",
    label: "Mất răng",
    shortLabel: "MT",
    color: "#68777c",
    targets: ["tooth"],
    defaultTarget: "tooth",
    kind: "condition",
    status: "observed",
  },
  {
    id: "extraction",
    label: "Chỉ định nhổ",
    shortLabel: "CN",
    color: "#d64045",
    targets: ["tooth"],
    defaultTarget: "tooth",
    kind: "procedure",
    status: "planned",
  },
  {
    id: "fracture",
    label: "Nứt / gãy",
    shortLabel: "NG",
    color: "#d36b28",
    targets: ["crown", "root"],
    defaultTarget: "crown",
    kind: "condition",
    status: "observed",
  },
] as const;

type ToothId = (typeof allTeeth)[number];
type Dentition = "adult" | "primary";
type SurfaceCode = "M" | "D" | "B" | "L" | "O" | "I";
type AnatomyZone = "crown" | "root";
type ConditionId = (typeof conditionOptions)[number]["id"];
type ClinicalMarkerId = (typeof clinicalMarkerOptions)[number]["id"];
type MarkerTarget = "tooth" | AnatomyZone;
type NativeMarkerId =
  | "pulpitis"
  | "periodontitis"
  | "periapical"
  | "rootCanal"
  | "crown"
  | "extraction";
type SurfaceState = Record<string, ConditionId>;
type AnatomyState = Record<string, ConditionId>;
type MarkerState = Record<string, true>;
type MarkerTargetState = Record<string, MarkerTarget>;
type BridgeSpan = {
  id: string;
  dentition: Dentition;
  teeth: ToothId[];
};
type QuickDiagnosisScope = GeneralAssessmentScope;
type QuickDiagnosisState = GeneralAssessmentState;
export type OdontogramProps = {
  assetBaseUrl?: string;
  beforeToolbar?: ReactNode;
  brandHref?: string;
  defaultSelectedTeeth?: string[];
  defaultValue?: OdontogramDataInput;
  embedded?: boolean;
  logoUrl?: string;
  onChange?: (data: OdontogramData) => void;
  onSelectionChange?: (teeth: string[]) => void;
  readOnly?: boolean;
  selectedTeeth?: string[];
};
type HistoryEntry = {
  surfaceState: SurfaceState;
  anatomyState: AnatomyState;
  markerState: MarkerState;
  markerTargetState: MarkerTargetState;
  bridges: BridgeSpan[];
  quickDiagnosis: QuickDiagnosisState;
  extraEntries: OdontogramEntry[];
};

type QuickDiagnosisGroup = {
  id: string;
  label: string;
  options: readonly {
    value: string;
    label: string;
    summary: string;
  }[];
};

const quickDiagnosisGroups: Record<
  QuickDiagnosisScope,
  readonly QuickDiagnosisGroup[]
> = {
  both: [
    {
      id: "gingiva",
      label: "Tình trạng lợi",
      options: [
        { value: "healthy", label: "Bình thường", summary: "Lợi bình thường" },
        {
          value: "localized",
          label: "Viêm khu trú",
          summary: "Viêm lợi khu trú",
        },
        {
          value: "generalized",
          label: "Viêm toàn bộ",
          summary: "Viêm lợi toàn bộ",
        },
      ],
    },
    {
      id: "calculus",
      label: "Cao răng",
      options: [
        { value: "none", label: "Không", summary: "Không thấy cao răng" },
        { value: "light", label: "Ít", summary: "Cao răng ít" },
        { value: "moderate", label: "Vừa", summary: "Cao răng mức vừa" },
        { value: "heavy", label: "Nhiều", summary: "Cao răng nhiều" },
      ],
    },
    {
      id: "plaque",
      label: "Mảng bám",
      options: [
        { value: "low", label: "Ít", summary: "Mảng bám ít" },
        { value: "moderate", label: "Vừa", summary: "Mảng bám mức vừa" },
        { value: "high", label: "Nhiều", summary: "Mảng bám nhiều" },
      ],
    },
    {
      id: "oral-hygiene",
      label: "Vệ sinh răng miệng",
      options: [
        { value: "good", label: "Tốt", summary: "Vệ sinh răng miệng tốt" },
        {
          value: "fair",
          label: "Trung bình",
          summary: "Vệ sinh răng miệng trung bình",
        },
        { value: "poor", label: "Kém", summary: "Vệ sinh răng miệng kém" },
      ],
    },
    {
      id: "angle",
      label: "Tương quan Angle",
      options: [
        { value: "class-i", label: "Loại I", summary: "Angle I" },
        { value: "class-ii-1", label: "Loại II/1", summary: "Angle II/1" },
        { value: "class-ii-2", label: "Loại II/2", summary: "Angle II/2" },
        { value: "class-iii", label: "Loại III", summary: "Angle III" },
      ],
    },
    {
      id: "overjet",
      label: "Độ cắn chìa",
      options: [
        { value: "normal", label: "Bình thường", summary: "Cắn chìa bình thường" },
        { value: "increased", label: "Tăng", summary: "Cắn chìa tăng" },
        { value: "reverse", label: "Cắn ngược", summary: "Cắn ngược" },
      ],
    },
    {
      id: "overbite",
      label: "Độ cắn phủ",
      options: [
        { value: "normal", label: "Bình thường", summary: "Cắn phủ bình thường" },
        { value: "deep", label: "Cắn sâu", summary: "Cắn sâu" },
        { value: "open", label: "Cắn hở", summary: "Cắn hở" },
      ],
    },
    {
      id: "crossbite",
      label: "Cắn chéo",
      options: [{ value: "present", label: "Có", summary: "Cắn chéo" }],
    },
    {
      id: "midline",
      label: "Đường giữa",
      options: [{ value: "deviated", label: "Lệch", summary: "Lệch đường giữa" }],
    },
  ],
  upper: [],
  lower: [],
};

const archDiagnosisGroups: readonly QuickDiagnosisGroup[] = [
  {
    id: "crowding",
    label: "Chen chúc",
    options: [
      { value: "mild", label: "Nhẹ", summary: "Chen chúc nhẹ" },
      { value: "moderate", label: "Vừa", summary: "Chen chúc vừa" },
      { value: "severe", label: "Nặng", summary: "Chen chúc nặng" },
    ],
  },
  {
    id: "spacing",
    label: "Khe thưa",
    options: [
      { value: "mild", label: "Ít", summary: "Khe thưa ít" },
      { value: "moderate", label: "Vừa", summary: "Khe thưa vừa" },
      { value: "severe", label: "Nhiều", summary: "Khe thưa nhiều" },
    ],
  },
  {
    id: "narrow",
    label: "Cung hàm hẹp",
    options: [{ value: "present", label: "Có", summary: "Cung hàm hẹp" }],
  },
  {
    id: "asymmetry",
    label: "Bất đối xứng",
    options: [{ value: "present", label: "Có", summary: "Bất đối xứng" }],
  },
];

quickDiagnosisGroups.upper = archDiagnosisGroups;
quickDiagnosisGroups.lower = archDiagnosisGroups;

const nativeMarkerIds = new Set<ClinicalMarkerId>([
  "pulpitis",
  "periodontitis",
  "periapical",
  "rootCanal",
  "crown",
  "extraction",
]);

const markerConflicts: Record<ClinicalMarkerId, ClinicalMarkerId[]> = {
  missing: clinicalMarkerOptions
    .map((marker) => marker.id)
    .filter((marker) => marker !== "missing" && marker !== "boneLoss"),
  implant: [
    "missing",
    "pulpitis",
    "rootCanal",
    "periapical",
    "fracture",
    "extraction",
  ],
  pulpitis: ["missing", "implant"],
  rootCanal: ["missing", "implant"],
  crown: ["missing"],
  fracture: ["missing", "implant"],
  extraction: ["missing", "implant"],
  periodontitis: ["missing"],
  periapical: ["missing", "implant"],
  boneLoss: [],
};

const surfaceNames: Record<SurfaceCode, string> = {
  M: "Mesial",
  D: "Distal",
  B: "Buccal",
  L: "Lingual / Palatal",
  O: "Occlusal",
  I: "Incisal",
};

const anatomyNames: Record<AnatomyZone, string> = {
  crown: "Thân răng",
  root: "Chân răng",
};

const AssetBaseContext = createContext("/odontogram-assets");

function emptyQuickDiagnosis(): QuickDiagnosisState {
  return {
    both: {},
    upper: {},
    lower: {},
    notes: {
      both: "",
      upper: "",
      lower: "",
    },
  };
}

function isToothId(value: string): value is ToothId {
  return allTeeth.includes(value as ToothId);
}

function normalizeSelectedTeeth(
  values: readonly string[] | undefined,
) {
  return [...new Set(values?.filter(isToothId) ?? [])];
}

function isConditionId(value: unknown): value is ConditionId {
  return conditionOptions.some((condition) => condition.id === value);
}

function isClinicalMarkerId(value: unknown): value is ClinicalMarkerId {
  return clinicalMarkerOptions.some((marker) => marker.id === value);
}

function archTeethFor(tooth: ToothId): readonly ToothId[] {
  if (adultUpperTeeth.includes(tooth as (typeof adultUpperTeeth)[number])) {
    return adultUpperTeeth;
  }
  if (adultLowerTeeth.includes(tooth as (typeof adultLowerTeeth)[number])) {
    return adultLowerTeeth;
  }
  if (primaryUpperTeeth.includes(tooth as (typeof primaryUpperTeeth)[number])) {
    return primaryUpperTeeth;
  }
  return primaryLowerTeeth;
}

function normalizeBridgeTeeth(teeth: readonly ToothId[]) {
  if (teeth.length < 2) {
    return null;
  }

  const unique = [...new Set(teeth)];
  const arch = archTeethFor(unique[0]);

  if (!unique.every((tooth) => arch.includes(tooth))) {
    return null;
  }

  const sorted = [...unique].sort(
    (left, right) => arch.indexOf(left) - arch.indexOf(right),
  );
  const indexes = sorted.map((tooth) => arch.indexOf(tooth));
  const contiguous = indexes.every(
    (index, position) => position === 0 || index === indexes[position - 1] + 1,
  );

  return contiguous ? sorted : null;
}

function bridgeIdFor(dentition: Dentition, teeth: readonly ToothId[]) {
  return `${dentition}:${teeth.join("-")}`;
}

function parseStoredState(value: string | null): SurfaceState {
  if (!value) {
    return {};
  }

  try {
    const parsed = JSON.parse(value) as unknown;

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).filter(([key, condition]) => {
        const [tooth, surface] = key.split(".");
        return (
          isToothId(tooth) &&
          ["M", "D", "B", "L", "O", "I"].includes(surface) &&
          isConditionId(condition)
        );
      }),
    ) as SurfaceState;
  } catch {
    return {};
  }
}

function parseStoredAnatomyState(value: string | null): AnatomyState {
  if (!value) {
    return {};
  }

  try {
    const parsed = JSON.parse(value) as unknown;

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).filter(([key, condition]) => {
        const [tooth, zone, extra] = key.split(".");
        return (
          extra === undefined &&
          isToothId(tooth) &&
          (zone === "crown" || zone === "root") &&
          isConditionId(condition)
        );
      }),
    ) as AnatomyState;
  } catch {
    return {};
  }
}

function parseStoredMarkerState(value: string | null): MarkerState {
  if (!value) {
    return {};
  }

  try {
    const parsed = JSON.parse(value) as unknown;

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).filter(([key, enabled]) => {
        const [tooth, marker] = key.split(".");
        return isToothId(tooth) && isClinicalMarkerId(marker) && enabled === true;
      }),
    ) as MarkerState;
  } catch {
    return {};
  }
}

function parseStoredBridges(value: string | null): BridgeSpan[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.flatMap((entry) => {
      if (!entry || typeof entry !== "object") {
        return [];
      }

      const candidate = entry as { dentition?: unknown; teeth?: unknown };
      if (
        (candidate.dentition !== "adult" &&
          candidate.dentition !== "primary") ||
        !Array.isArray(candidate.teeth) ||
        !candidate.teeth.every(
          (tooth): tooth is ToothId =>
            typeof tooth === "string" && isToothId(tooth),
        )
      ) {
        return [];
      }

      const teeth = normalizeBridgeTeeth(candidate.teeth);
      if (
        !teeth ||
        teeth.some(
          (tooth) =>
            (candidate.dentition === "primary") !== isPrimaryTooth(tooth),
        )
      ) {
        return [];
      }

      return [
        {
          id: bridgeIdFor(candidate.dentition, teeth),
          dentition: candidate.dentition,
          teeth,
        },
      ];
    });
  } catch {
    return [];
  }
}

function parseStoredQuickDiagnosis(value: string | null): QuickDiagnosisState {
  const result = emptyQuickDiagnosis();
  if (!value) {
    return result;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return result;
    }

    for (const scope of ["both", "upper", "lower"] as const) {
      const scopeValue = (parsed as Record<string, unknown>)[scope];
      if (
        !scopeValue ||
        typeof scopeValue !== "object" ||
        Array.isArray(scopeValue)
      ) {
        continue;
      }

      for (const group of quickDiagnosisGroups[scope]) {
        const selected = (scopeValue as Record<string, unknown>)[group.id];
        if (
          typeof selected === "string" &&
          group.options.some((option) => option.value === selected)
        ) {
          result[scope][group.id] = selected;
        }
      }
    }

    const notesValue = (parsed as Record<string, unknown>).notes;
    if (
      notesValue &&
      typeof notesValue === "object" &&
      !Array.isArray(notesValue)
    ) {
      for (const scope of ["both", "upper", "lower"] as const) {
        const note = (notesValue as Record<string, unknown>)[scope];
        if (typeof note === "string") {
          result.notes[scope] = note.slice(0, 500);
        }
      }
    }

    return result;
  } catch {
    return result;
  }
}

function normalizeStoredState(
  surfaceState: SurfaceState,
  anatomyState: AnatomyState,
  markerState: MarkerState,
) {
  const nextSurfaces = { ...surfaceState };
  const nextAnatomy = { ...anatomyState };
  const nextMarkers = { ...markerState };

  for (const tooth of allTeeth) {
    if (hasMarker(nextMarkers, tooth, "missing")) {
      for (const marker of clinicalMarkerOptions) {
        if (marker.id !== "missing" && marker.id !== "boneLoss") {
          delete nextMarkers[markerKey(tooth, marker.id)];
        }
      }
      for (const surface of toothSurfaces(tooth)) {
        delete nextSurfaces[surfaceKey(tooth, surface)];
      }
      delete nextAnatomy[anatomyKey(tooth, "crown")];
      delete nextAnatomy[anatomyKey(tooth, "root")];
      continue;
    }

    if (hasMarker(nextMarkers, tooth, "implant")) {
      for (const conflict of markerConflicts.implant) {
        delete nextMarkers[markerKey(tooth, conflict)];
      }
      for (const surface of toothSurfaces(tooth)) {
        delete nextSurfaces[surfaceKey(tooth, surface)];
      }
      delete nextAnatomy[anatomyKey(tooth, "crown")];
      delete nextAnatomy[anatomyKey(tooth, "root")];
    }

  }

  return {
    surfaceState: nextSurfaces,
    anatomyState: nextAnatomy,
    markerState: nextMarkers,
  };
}

type NormalizedOdontogramData = {
  surfaceState: SurfaceState;
  anatomyState: AnatomyState;
  markerState: MarkerState;
  markerTargetState: MarkerTargetState;
  bridges: BridgeSpan[];
  quickDiagnosis: QuickDiagnosisState;
  extraEntries: OdontogramEntry[];
};

function normalizeDefaultValue(
  value?: OdontogramDataInput,
): NormalizedOdontogramData {
  if (!value) {
    return {
      surfaceState: {},
      anatomyState: {},
      markerState: {},
      markerTargetState: {},
      bridges: [],
      quickDiagnosis: emptyQuickDiagnosis(),
      extraEntries: [],
    };
  }

  if (value.version === 1) {
    return normalizeLegacyValue(value);
  }

  const surfaceState: SurfaceState = {};
  const anatomyState: AnatomyState = {};
  const markerState: MarkerState = {};
  const markerTargetState: MarkerTargetState = {};
  const bridges: BridgeSpan[] = [];
  const extraEntries: OdontogramEntry[] = [];

  for (const entry of Array.isArray(value.entries) ? value.entries : []) {
    if (!isValidEntry(entry)) {
      continue;
    }

    const condition = conditionIdFromEntry(entry);
    if (
      condition &&
      entry.target.scope === "surface" &&
      entry.target.teeth.length === 1 &&
      entry.target.surface
    ) {
      const tooth = entry.target.teeth[0];
      if (isToothId(tooth) && toothSurfaces(tooth).includes(entry.target.surface)) {
        surfaceState[surfaceKey(tooth, entry.target.surface)] = condition;
        continue;
      }
    }

    if (
      condition &&
      entry.target.scope === "region" &&
      entry.target.teeth.length === 1 &&
      entry.target.region
    ) {
      const tooth = entry.target.teeth[0];
      if (isToothId(tooth)) {
        anatomyState[anatomyKey(tooth, entry.target.region)] = condition;
        continue;
      }
    }

    const marker = markerIdFromEntry(entry);
    if (
      marker &&
      entry.target.teeth.length === 1 &&
      (entry.target.scope === "tooth" || entry.target.scope === "region")
    ) {
      const tooth = entry.target.teeth[0];
      if (isToothId(tooth)) {
        const key = markerKey(tooth, marker);
        markerState[key] = true;
        markerTargetState[key] =
          entry.target.scope === "region" && entry.target.region
            ? entry.target.region
            : "tooth";
        continue;
      }
    }

    if (
      entry.conceptId === "bridge" &&
      entry.target.scope === "span" &&
      entry.target.dentition
    ) {
      const parsed = parseStoredBridges(
        JSON.stringify([
          {
            dentition: entry.target.dentition,
            teeth: entry.target.teeth,
          },
        ]),
      );
      if (parsed[0]) {
        bridges.push(parsed[0]);
        continue;
      }
    }

    extraEntries.push(cloneEntry(entry));
  }

  const normalized = normalizeStoredState(
    surfaceState,
    anatomyState,
    markerState,
  );

  return {
    ...normalized,
    markerTargetState: Object.fromEntries(
      Object.entries(markerTargetState).filter(([key]) => normalized.markerState[key]),
    ),
    bridges: parseStoredBridges(JSON.stringify(bridges)),
    quickDiagnosis: parseStoredQuickDiagnosis(
      JSON.stringify(value.generalAssessment),
    ),
    extraEntries,
  };
}

function normalizeLegacyValue(
  value: LegacyOdontogramData,
): NormalizedOdontogramData {
  const normalized = normalizeStoredState(
    parseStoredState(JSON.stringify(value.surfaceState)),
    parseStoredAnatomyState(JSON.stringify(value.anatomyState ?? {})),
    parseStoredMarkerState(JSON.stringify(value.markerState)),
  );
  const markerTargetState: MarkerTargetState = {};

  for (const key of Object.keys(normalized.markerState)) {
    const marker = key.split(".")[1] as ClinicalMarkerId;
    markerTargetState[key] = markerFor(marker)?.defaultTarget ?? "tooth";
  }

  return {
    ...normalized,
    markerTargetState,
    bridges: parseStoredBridges(JSON.stringify(value.bridges)),
    quickDiagnosis: parseStoredQuickDiagnosis(
      JSON.stringify(value.quickDiagnosis),
    ),
    extraEntries: [],
  };
}

function createDataSnapshot(
  surfaceState: SurfaceState,
  anatomyState: AnatomyState,
  markerState: MarkerState,
  markerTargetState: MarkerTargetState,
  bridges: BridgeSpan[],
  quickDiagnosis: QuickDiagnosisState,
  extraEntries: OdontogramEntry[],
): OdontogramData {
  const generatedEntries: OdontogramEntry[] = [
    ...Object.entries(surfaceState).flatMap(([key, condition]) => {
      const [tooth, surface] = key.split(".");
      const option = conditionFor(condition);
      if (!option || !isToothId(tooth) || !isSurfaceCode(surface)) {
        return [];
      }
      return [
        {
          id: `surface:${tooth}:${surface}`,
          conceptId: option.conceptId,
          kind: option.kind,
          status: option.status,
          target: {
            scope: "surface",
            teeth: [tooth],
            surface,
            dentition: isPrimaryTooth(tooth) ? "primary" : "adult",
          },
          attributes: { conditionId: condition },
        } satisfies OdontogramEntry,
      ];
    }),
    ...Object.entries(anatomyState).flatMap(([key, condition]) => {
      const [tooth, region] = key.split(".");
      const option = conditionFor(condition);
      if (
        !option ||
        !isToothId(tooth) ||
        (region !== "crown" && region !== "root")
      ) {
        return [];
      }
      return [
        {
          id: `region:${tooth}:${region}:condition`,
          conceptId: option.conceptId,
          kind: option.kind,
          status: option.status,
          target: {
            scope: "region",
            teeth: [tooth],
            region,
            dentition: isPrimaryTooth(tooth) ? "primary" : "adult",
          },
          attributes: { conditionId: condition },
        } satisfies OdontogramEntry,
      ];
    }),
    ...Object.keys(markerState).flatMap((key) => {
      const [tooth, marker] = key.split(".");
      if (!isToothId(tooth) || !isClinicalMarkerId(marker)) {
        return [];
      }
      const option = markerFor(marker);
      const target = markerTargetState[key] ?? option.defaultTarget;
      return [
        {
          id: `marker:${tooth}:${marker}`,
          conceptId: `marker.${marker}`,
          kind: option.kind,
          status: option.status,
          target: {
            scope: target === "tooth" ? "tooth" : "region",
            teeth: [tooth],
            ...(target === "tooth" ? {} : { region: target }),
            dentition: isPrimaryTooth(tooth) ? "primary" : "adult",
          },
          attributes: { markerId: marker },
        } satisfies OdontogramEntry,
      ];
    }),
    ...bridges.map(
      (bridge): OdontogramEntry => ({
        id: `bridge:${bridge.id}`,
        conceptId: "bridge",
        kind: "prosthesis",
        status: "existing",
        target: {
          scope: "span",
          teeth: [...bridge.teeth],
          dentition: bridge.dentition,
        },
      }),
    ),
  ];
  const generatedIds = new Set(generatedEntries.map((entry) => entry.id));

  return {
    version: 2,
    entries: [
      ...extraEntries
        .filter((entry) => !generatedIds.has(entry.id))
        .map(cloneEntry),
      ...generatedEntries,
    ],
    generalAssessment: cloneQuickDiagnosis(quickDiagnosis),
  };
}

function cloneQuickDiagnosis(
  value: QuickDiagnosisState,
): QuickDiagnosisState {
  return {
    both: { ...value.both },
    upper: { ...value.upper },
    lower: { ...value.lower },
    notes: { ...value.notes },
  };
}

function cloneEntry(entry: OdontogramEntry): OdontogramEntry {
  return {
    ...entry,
    target: {
      ...entry.target,
      teeth: [...entry.target.teeth],
    },
    ...(entry.attributes ? { attributes: { ...entry.attributes } } : {}),
  };
}

function isValidEntry(value: unknown): value is OdontogramEntry {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const entry = value as Partial<OdontogramEntry>;
  const target = entry.target;
  return (
    typeof entry.id === "string" &&
    entry.id.length > 0 &&
    typeof entry.conceptId === "string" &&
    entry.conceptId.length > 0 &&
    ["condition", "restoration", "procedure", "prosthesis"].includes(
      entry.kind ?? "",
    ) &&
    ["observed", "existing", "planned", "monitoring"].includes(
      entry.status ?? "",
    ) &&
    Boolean(target) &&
    ["tooth", "surface", "region", "span"].includes(target?.scope ?? "") &&
    Array.isArray(target?.teeth) &&
    target.teeth.every((tooth) => typeof tooth === "string" && isToothId(tooth))
  );
}

function conditionIdFromEntry(entry: OdontogramEntry) {
  const conditionId = entry.attributes?.conditionId;
  if (isConditionId(conditionId)) {
    return conditionId;
  }
  return conditionOptions.find(
    (option) =>
      option.conceptId === entry.conceptId &&
      option.kind === entry.kind &&
      option.status === entry.status,
  )?.id;
}

function markerIdFromEntry(entry: OdontogramEntry) {
  const markerId = entry.attributes?.markerId;
  if (isClinicalMarkerId(markerId)) {
    return markerId;
  }
  const conceptMarker = entry.conceptId.startsWith("marker.")
    ? entry.conceptId.slice("marker.".length)
    : "";
  return isClinicalMarkerId(conceptMarker) ? conceptMarker : undefined;
}

function isSurfaceCode(value: string): value is SurfaceCode {
  return ["M", "D", "B", "L", "O", "I"].includes(value);
}

function surfaceKey(tooth: ToothId, surface: SurfaceCode) {
  return `${tooth}.${surface}`;
}

function anatomyKey(tooth: ToothId, zone: AnatomyZone) {
  return `${tooth}.${zone}`;
}

function markerKey(tooth: ToothId, marker: ClinicalMarkerId) {
  return `${tooth}.${marker}`;
}

function hasMarker(
  state: MarkerState,
  tooth: ToothId,
  marker: ClinicalMarkerId,
) {
  return state[markerKey(tooth, marker)] === true;
}

function isToothUnavailable(state: MarkerState, tooth: ToothId) {
  return hasMarker(state, tooth, "missing") || hasMarker(state, tooth, "implant");
}

function toothPosition(tooth: ToothId) {
  return Number(tooth[1]);
}

function isPrimaryTooth(tooth: ToothId) {
  return Number(tooth[0]) >= 5;
}

function isUpperTooth(tooth: ToothId) {
  return [1, 2, 5, 6].includes(Number(tooth[0]));
}

function isRightQuadrant(tooth: ToothId) {
  return [1, 4, 5, 8].includes(Number(tooth[0]));
}

function isPatientLeft(tooth: ToothId) {
  return [2, 3, 6, 7].includes(Number(tooth[0]));
}

function isAnterior(tooth: ToothId) {
  return toothPosition(tooth) <= 3;
}

function toothType(tooth: ToothId) {
  const position = toothPosition(tooth);

  if (isPrimaryTooth(tooth)) {
    if (position <= 2) return "Răng cửa sữa";
    if (position === 3) return "Răng nanh sữa";
    return "Răng hàm sữa";
  }

  if (position <= 2) return "Răng cửa";
  if (position === 3) return "Răng nanh";
  if (position <= 5) return "Răng hàm nhỏ";
  return "Răng hàm lớn";
}

type ToothTemplate = "11" | "13" | "14" | "16";

function toothTemplate(tooth: ToothId): ToothTemplate {
  const position = toothPosition(tooth);

  if (position <= 2) return "11";
  if (position === 3) return "13";
  if (isPrimaryTooth(tooth) || position <= 5) return "14";
  return "16";
}

type ToothAnatomyGeometry = {
  width: number;
  height: number;
  outline: string;
  cervicalY: number;
  cervicalCenterY: number;
};

const adultToothOutlines: Record<ToothTemplate, string> = {
  "11":
    "M17.2.9c-2.4,4.5-3.3,9.5-3.6,14.5-.3,4.6-.9,9-1.3,13.6-.3,3.2-1.3,6.2-2.8,9-1.6,3.5-3.1,8.2-3.3,12.3-.3,6,2,11.1,8.1,11.1s16.5,1.1,16.5-4.3-.3-11.8-2.3-17-.3-.8-.5-1.2c-1.1-2.4-2.1-5.9-1.9-8.3.5-6.5-1.8-13.8-3-20.3-.4-3.6-1.2-7.1-4.2-9.4",
  "13":
    "M17.1,2.3c-.7,1.2-1.6,2.5-2.1,3.9-1.6,5-1.9,11-2.9,16-.7,6.7-3.6,11.9-4.6,18.3-.7,4.1.9,7.7,2.3,11.5,1.4,5.1,4.2,13.2,10.3,11,4.9-2.1,8.4-11.8,9.1-16.8.5-3.6.5-7.8-1.2-11.2s-3-4.9-3.3-8.1c-.8-4.7-1.3-13.3-2.3-17.9-.4-2.6-1.9-4.6-3.6-6.4",
  "14":
    "M13.2,18.8c.3,1.9.9,4.3,2.6,5.3,1.5.9,2.9-.4,3.4-1.8,1.7-4.8.3-10.7,2.2-15.5.8-1.7,2.6-1.5,3.4.2,1,1.9,1.1,4.3,1.4,6.5.3,3.8-.7,7.3-1.6,11-1,4-1.2,8.3,0,12.4,1.8,8,7.5,21.1-2,24.4-1.4.2-2.9-.5-4.5-.9-3-1-5.1,1-8,1.5-8.9,1.4-6.7-14.5-4.9-19.4.9-2.3,1.9-4.7,2.1-7.3.3-5.2-1.1-10.8-.8-15.9,0-3.3.5-6.8,1.2-10.1.2-1.7,2.2-5.9,3.9-3.2,1.4,3.9.9,8.8,1.6,12.6,0,0,0,.2,0,.2Z",
  "16":
    "M20.1,24.1c1.9.9,3.6-.4,4.2-1.8,2.1-4.8.4-10.7,2.7-15.5,1-1.7,3.2-1.5,4.2.2,1.2,1.9,1.4,4.3,1.7,6.5.4,3.8-.9,7.3-2,11-1.2,4-1.5,8.3,0,12.4,2.2,8,9.3,21.1-2.6,24.4-1.7.2-3.6-.5-5.6-.9-3.7-1-6.4,1-10,1.5-11.1,1.4-8.4-14.5-6-19.4,1.1-2.3,2.4-4.7,2.6-7.3.4-5.2-1.4-10.8-1-15.9,0-3.3.6-6.8,1.5-10.1.2-1.7,2.7-5.9,4.9-3.2,1.7,3.9,1.1,8.8,2,12.6,0,0,1.3,4.5,3.4,5.5Z",
};

const primaryToothOutlines: Partial<Record<ToothTemplate, string>> = {
  "11":
    "M16.4.6c-2.4,4.5-2.5,9.8-2.8,14.8-.3,4.6-.9,9-1.3,13.6-.3,3.2-1.3,6.2-2.8,9-1.6,3.5-3.1,8.2-3.3,12.3-.3,6,2,11.1,8.1,11.1s16.5,1.1,16.5-4.3-.3-11.8-2.3-17-.3-.8-.5-1.2c-1.1-2.4-2.1-5.9-1.9-8.3.5-6.5-1.8-13.8-3-20.3-.4-3.6-1.6-7-4.6-9.3",
  "13": adultToothOutlines["13"],
  "14":
    "M13.1,18.3c.4,3.5,3.9,7.9,6.5,3.3,2.1-4.7.3-10.6,2.6-15.3.4-.8,1.3-1.4,2.2-1.1,2.5,1,2.6,4.6,3,7,.8,5.4-1.8,10.5-2.4,15.8-.4,3.1.2,6.3.9,9.3.7,5.1,4.1,11.4,4.4,16.8.5,6.1-5.3,8.4-10.2,6-1-.6-1.7-1.8-2.9-2-1.9-.2-4.5,2.5-7,3.2-1,.3-2.2.3-3.2,0-6.5-1.9-4.6-13.7-3-18.6,1-2.6,2.3-5.2,2.5-8,.4-5.6-1.2-11.3-.8-16.8,0-2.5.4-5.1.9-7.6.4-1.8.8-3.9,2.2-5.1,1.2-1.1,2.4,0,2.8,1.3,1.2,3.8.8,8,1.5,11.7v.2h0Z",
};

const toothTemplateWidths: Record<ToothTemplate, number> = {
  "11": 36,
  "13": 36,
  "14": 32.3,
  "16": 40.6,
};

function toothAnatomyGeometry(tooth: ToothId): ToothAnatomyGeometry {
  const template = toothTemplate(tooth);
  const primaryOutline = primaryToothOutlines[template];

  return {
    width: toothTemplateWidths[template],
    height: 64,
    outline:
      isPrimaryTooth(tooth) && primaryOutline
        ? primaryOutline
        : adultToothOutlines[template],
    cervicalY: template === "11" || template === "13" ? 32 : 33,
    cervicalCenterY: template === "11" || template === "13" ? 30 : 31,
  };
}

function anatomyClipPath(
  geometry: ToothAnatomyGeometry,
  zone: AnatomyZone,
) {
  const { width, height, cervicalY, cervicalCenterY } = geometry;
  const left = -1;
  const right = width + 1;
  const firstControl = width * 0.25;
  const secondControl = width * 0.75;

  if (zone === "root") {
    return `M${left} -1 H${right} V${cervicalY} C${secondControl} ${cervicalCenterY}, ${firstControl} ${cervicalCenterY}, ${left} ${cervicalY} Z`;
  }

  return `M${left} ${cervicalY} C${firstControl} ${cervicalCenterY}, ${secondControl} ${cervicalCenterY}, ${right} ${cervicalY} V${
    height + 1
  } H${left} Z`;
}

function toothArtworkPath(
  tooth: ToothId,
  assetBaseUrl: string,
  variant?:
    | "implant"
    | "bone"
    | "boneLoss"
    | "boneLossOnly"
    | "implantBoneLoss"
    | NativeMarkerId,
) {
  const dentition = isPrimaryTooth(tooth) ? "primary" : "adult";
  const suffix = variant ? `-${variant}` : "";
  const fileName = `${toothTemplate(tooth)}-${dentition}${suffix}.svg`;
  return `${assetBaseUrl.replace(/\/$/, "")}/${fileName}`;
}

function toothSurfaces(tooth: ToothId): SurfaceCode[] {
  return ["M", "D", "B", "L", isAnterior(tooth) ? "I" : "O"];
}

function surfaceLayout(tooth: ToothId) {
  const upper = isUpperTooth(tooth);
  const rightQuadrant = isRightQuadrant(tooth);

  return {
    top: upper ? "B" : "L",
    right: rightQuadrant ? "M" : "D",
    bottom: upper ? "L" : "B",
    left: rightQuadrant ? "D" : "M",
    center: isAnterior(tooth) ? "I" : "O",
  } satisfies Record<"top" | "right" | "bottom" | "left" | "center", SurfaceCode>;
}

function conditionFor(id?: ConditionId) {
  return conditionOptions.find((condition) => condition.id === id);
}

function markerFor(id: ClinicalMarkerId) {
  return clinicalMarkerOptions.find((marker) => marker.id === id)!;
}

function markerTargetForSelection(
  marker: ClinicalMarkerId,
  selectedZone: AnatomyZone | null,
): MarkerTarget {
  const option = markerFor(marker);
  const targets = option.targets as readonly MarkerTarget[];
  return selectedZone && targets.includes(selectedZone)
    ? selectedZone
    : option.defaultTarget;
}

function quickDiagnosisSummary(
  state: QuickDiagnosisState,
  scope: QuickDiagnosisScope,
) {
  const summaries = quickDiagnosisGroups[scope].flatMap((group) => {
    const selected = state[scope][group.id];
    const option = group.options.find((item) => item.value === selected);
    return option ? [option.summary] : [];
  });
  const note = state.notes[scope].trim();
  return note ? [...summaries, note] : summaries;
}

function buildExportData(
  surfaceState: SurfaceState,
  anatomyState: AnatomyState,
  markerState: MarkerState,
  markerTargetState: MarkerTargetState,
  bridges: BridgeSpan[],
  quickDiagnosis: QuickDiagnosisState,
  dentition: Dentition,
) {
  const surfaces = Object.entries(surfaceState).map(([key, condition]) => {
    const [tooth, surface] = key.split(".");
    return {
      tooth,
      dentition,
      surface,
      surfaceName: surfaceNames[surface as SurfaceCode],
      condition,
      conditionName: conditionFor(condition)?.label ?? condition,
    };
  });
  const markers = Object.keys(markerState).map((key) => {
    const [tooth, marker] = key.split(".");
    return {
      tooth,
      dentition,
      marker,
      markerName: markerFor(marker as ClinicalMarkerId)?.label ?? marker,
      target: markerTargetState[key] ?? "tooth",
    };
  });
  const anatomy = Object.entries(anatomyState).map(([key, condition]) => {
    const [tooth, zone] = key.split(".");
    return {
      tooth,
      dentition,
      zone,
      zoneName: anatomyNames[zone as AnatomyZone],
      condition,
      conditionName: conditionFor(condition)?.label ?? condition,
    };
  });

  return {
    notation: "FDI",
    dentition,
    surfaces,
    anatomy,
    markers,
    bridges,
    generalAssessment: quickDiagnosis,
  };
}

function downloadJson(
  surfaceState: SurfaceState,
  anatomyState: AnatomyState,
  markerState: MarkerState,
  markerTargetState: MarkerTargetState,
  bridges: BridgeSpan[],
  quickDiagnosis: QuickDiagnosisState,
  dentition: Dentition,
) {
  const blob = new Blob(
    [
      JSON.stringify(
        buildExportData(
          surfaceState,
          anatomyState,
          markerState,
          markerTargetState,
          bridges,
          quickDiagnosis,
          dentition,
        ),
        null,
        2,
      ),
    ],
    { type: "application/json" },
  );
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `codexdentist-odontogram-${dentition}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function Odontogram({
  assetBaseUrl = "/odontogram-assets",
  beforeToolbar,
  brandHref = "https://codexdentist.com",
  defaultSelectedTeeth,
  defaultValue,
  embedded = false,
  logoUrl = "/icons/codexmed-icon.svg",
  onChange,
  onSelectionChange,
  readOnly = false,
  selectedTeeth: controlledSelectedTeeth,
}: OdontogramProps) {
  const [initialData] = useState(() => normalizeDefaultValue(defaultValue));
  const [surfaceState, setSurfaceState] = useState<SurfaceState>(
    initialData.surfaceState,
  );
  const [anatomyState, setAnatomyState] = useState<AnatomyState>(
    initialData.anatomyState,
  );
  const [markerState, setMarkerState] = useState<MarkerState>(
    initialData.markerState,
  );
  const [markerTargetState, setMarkerTargetState] =
    useState<MarkerTargetState>(initialData.markerTargetState);
  const [bridges, setBridges] = useState<BridgeSpan[]>(initialData.bridges);
  const [quickDiagnosis, setQuickDiagnosis] = useState<QuickDiagnosisState>(
    initialData.quickDiagnosis,
  );
  const [extraEntries] = useState<OdontogramEntry[]>(
    initialData.extraEntries,
  );
  const [quickDiagnosisScope, setQuickDiagnosisScope] =
    useState<QuickDiagnosisScope | null>(null);
  const [selectedAnatomyZone, setSelectedAnatomyZone] =
    useState<AnatomyZone | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [condition, setCondition] = useState<ConditionId>("caries");
  const [dentition, setDentition] = useState<Dentition>("adult");
  const [internalSelectedTeeth, setInternalSelectedTeeth] = useState<ToothId[]>(
    () => normalizeSelectedTeeth(defaultSelectedTeeth),
  );
  const [copied, setCopied] = useState(false);
  const lastNotifiedSnapshot = useRef(JSON.stringify(initialData));
  const selectedTeeth = controlledSelectedTeeth
    ? normalizeSelectedTeeth(controlledSelectedTeeth)
    : internalSelectedTeeth;
  const selectedTooth = selectedTeeth.at(-1);
  const previewTooth = selectedTooth ?? (dentition === "adult" ? "16" : "55");

  const setSelectedTeeth = (
    update: ToothId[] | ((current: ToothId[]) => ToothId[]),
  ) => {
    const next =
      typeof update === "function" ? update(selectedTeeth) : update;
    const normalized = normalizeSelectedTeeth(next);

    if (!controlledSelectedTeeth) {
      setInternalSelectedTeeth(normalized);
    }
    onSelectionChange?.(normalized);
  };

  useEffect(() => {
    const snapshot = createDataSnapshot(
      surfaceState,
      anatomyState,
      markerState,
      markerTargetState,
      bridges,
      quickDiagnosis,
      extraEntries,
    );
    const serialized = JSON.stringify(snapshot);
    if (serialized === lastNotifiedSnapshot.current) {
      return;
    }
    lastNotifiedSnapshot.current = serialized;

    onChange?.(snapshot);
  }, [
    anatomyState,
    bridges,
    extraEntries,
    markerState,
    markerTargetState,
    onChange,
    quickDiagnosis,
    surfaceState,
  ]);

  const commitSurfaceState = (
    update: (current: SurfaceState) => SurfaceState,
  ) => {
    setSurfaceState(update);
  };

  const commitAnatomyState = (
    update: (current: AnatomyState) => AnatomyState,
  ) => {
    setAnatomyState(update);
  };

  const commitMarkerState = (
    update: (current: MarkerState) => MarkerState,
  ) => {
    setMarkerState(update);
  };

  const commitMarkerTargetState = (
    update: (current: MarkerTargetState) => MarkerTargetState,
  ) => {
    setMarkerTargetState(update);
  };

  const commitBridges = (
    update: (current: BridgeSpan[]) => BridgeSpan[],
  ) => {
    setBridges(update);
  };

  const commitQuickDiagnosis = (
    update: (current: QuickDiagnosisState) => QuickDiagnosisState,
  ) => {
    setQuickDiagnosis(update);
  };

  const saveHistory = () => {
    const snapshot = {
      surfaceState: { ...surfaceState },
      anatomyState: { ...anatomyState },
      markerState: { ...markerState },
      markerTargetState: { ...markerTargetState },
      bridges: bridges.map((bridge) => ({
        ...bridge,
        teeth: [...bridge.teeth],
      })),
      quickDiagnosis: cloneQuickDiagnosis(quickDiagnosis),
      extraEntries: extraEntries.map(cloneEntry),
    };
    setHistory((current) => [...current.slice(-49), snapshot]);
  };

  const upperTeeth =
    dentition === "adult" ? adultUpperTeeth : primaryUpperTeeth;
  const lowerTeeth =
    dentition === "adult" ? adultLowerTeeth : primaryLowerTeeth;
  const activeToothSet = useMemo(
    () => new Set<ToothId>([...upperTeeth, ...lowerTeeth]),
    [upperTeeth, lowerTeeth],
  );
  const activeSurfaceState = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(surfaceState).filter(([key]) =>
          activeToothSet.has(key.split(".")[0] as ToothId),
        ),
      ) as SurfaceState,
    [activeToothSet, surfaceState],
  );
  const activeAnatomyState = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(anatomyState).filter(([key]) =>
          activeToothSet.has(key.split(".")[0] as ToothId),
        ),
      ) as AnatomyState,
    [activeToothSet, anatomyState],
  );
  const activeMarkerState = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(markerState).filter(([key]) =>
          activeToothSet.has(key.split(".")[0] as ToothId),
        ),
      ) as MarkerState,
    [activeToothSet, markerState],
  );
  const activeBridges = useMemo(
    () => bridges.filter((bridge) => bridge.dentition === dentition),
    [bridges, dentition],
  );
  const markedSurfaceCount = Object.keys(activeSurfaceState).length;
  const markedAnatomyCount = Object.keys(activeAnatomyState).length;
  const markedMarkerCount = Object.keys(activeMarkerState).length;
  const quickDiagnosisCount =
    (["both", "upper", "lower"] as const).reduce(
      (total, scope) => total + Object.keys(quickDiagnosis[scope]).length,
      0,
    ) +
    (["both", "upper", "lower"] as const).filter(
      (scope) => quickDiagnosis.notes[scope].trim().length > 0,
    ).length;
  const markedToothCount = new Set(
    [
      ...Object.keys(activeSurfaceState),
      ...Object.keys(activeAnatomyState),
      ...Object.keys(activeMarkerState),
      ...activeBridges.flatMap((bridge) => bridge.teeth),
    ].map((key) => key.split(".")[0]),
  ).size;

  const selectedRows = useMemo(
    () =>
      selectedTooth
        ? toothSurfaces(selectedTooth).map((surface) => ({
            surface,
            condition: surfaceState[surfaceKey(selectedTooth, surface)],
          }))
        : [],
    [selectedTooth, surfaceState],
  );
  const selectedToothUnavailable =
    !selectedTooth || isToothUnavailable(markerState, selectedTooth);
  const normalizedSelectedBridgeTeeth = normalizeBridgeTeeth(selectedTeeth);
  const selectedBridge = normalizedSelectedBridgeTeeth
    ? activeBridges.find(
        (bridge) =>
          bridge.teeth.length === normalizedSelectedBridgeTeeth.length &&
          bridge.teeth.every(
            (tooth, index) => tooth === normalizedSelectedBridgeTeeth[index],
          ),
      )
    : undefined;
  const bridgeAvailable = normalizedSelectedBridgeTeeth !== null;
  const displayedSelectedTeeth =
    normalizedSelectedBridgeTeeth ?? selectedTeeth;

  const selectTooth = (tooth: ToothId) => {
    setSelectedAnatomyZone(null);
    setSelectedTeeth((current) => {
      if (current.includes(tooth)) {
        return current.filter((selected) => selected !== tooth);
      }
      return [...current, tooth];
    });
  };

  const setSurface = (tooth: ToothId, surface: SurfaceCode) => {
    if (readOnly || isToothUnavailable(markerState, tooth)) {
      return;
    }

    const key = surfaceKey(tooth, surface);
    const previous = surfaceState[key];

    if (previous === condition) {
      return;
    }

    setSelectedTeeth((current) =>
      current.includes(tooth) ? current : [...current, tooth],
    );
    setSelectedAnatomyZone(null);
    saveHistory();
    commitSurfaceState((current) => ({ ...current, [key]: condition }));
  };

  const clearSurface = (tooth: ToothId, surface: SurfaceCode) => {
    if (readOnly || isToothUnavailable(markerState, tooth)) {
      return;
    }

    const key = surfaceKey(tooth, surface);
    const previous = surfaceState[key];

    if (!previous) {
      return;
    }

    saveHistory();
    commitSurfaceState((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const toggleAnatomy = (tooth: ToothId, zone: AnatomyZone) => {
    if (readOnly || isToothUnavailable(markerState, tooth)) {
      return;
    }

    const key = anatomyKey(tooth, zone);
    const previous = anatomyState[key];

    setSelectedTeeth((current) =>
      current.includes(tooth) ? current : [...current, tooth],
    );
    setSelectedAnatomyZone(zone);
    saveHistory();
    commitAnatomyState((current) => {
      const next = { ...current };
      if (previous === condition) {
        delete next[key];
      } else {
        next[key] = condition;
      }
      return next;
    });
  };

  const clearAnatomy = (tooth: ToothId, zone: AnatomyZone) => {
    if (readOnly || isToothUnavailable(markerState, tooth)) {
      return;
    }

    const key = anatomyKey(tooth, zone);
    if (!anatomyState[key]) {
      return;
    }

    saveHistory();
    commitAnatomyState((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const toggleMarker = (marker: ClinicalMarkerId) => {
    if (readOnly || selectedTeeth.length === 0) {
      return;
    }
    const markerTarget = markerTargetForSelection(marker, selectedAnatomyZone);
    const removeFromAll = selectedTeeth.every((tooth) => {
      const key = markerKey(tooth, marker);
      return (
        markerState[key] === true &&
        (markerTargetState[key] ?? markerFor(marker).defaultTarget) ===
          markerTarget
      );
    });
    saveHistory();

    const nextMarkers = { ...markerState };
    const nextMarkerTargets = { ...markerTargetState };
    const nextSurfaces = { ...surfaceState };
    const nextAnatomy = { ...anatomyState };
    for (const tooth of selectedTeeth) {
      const key = markerKey(tooth, marker);
      if (removeFromAll) {
        delete nextMarkers[key];
        delete nextMarkerTargets[key];
      } else {
        for (const conflict of markerConflicts[marker]) {
          const conflictKey = markerKey(tooth, conflict);
          delete nextMarkers[conflictKey];
          delete nextMarkerTargets[conflictKey];
        }
        nextMarkers[key] = true;
        nextMarkerTargets[key] = markerTarget;

        if (marker === "missing" || marker === "implant") {
          for (const surface of toothSurfaces(tooth)) {
            delete nextSurfaces[surfaceKey(tooth, surface)];
          }
          delete nextAnatomy[anatomyKey(tooth, "crown")];
          delete nextAnatomy[anatomyKey(tooth, "root")];
        }
      }
    }

    commitMarkerState(() => nextMarkers);
    commitMarkerTargetState(() => nextMarkerTargets);
    commitSurfaceState(() => nextSurfaces);
    commitAnatomyState(() => nextAnatomy);
  };

  const toggleBridge = () => {
    if (readOnly || !normalizedSelectedBridgeTeeth) {
      return;
    }

    saveHistory();
    if (selectedBridge) {
      commitBridges((current) =>
        current.filter((bridge) => bridge.id !== selectedBridge.id),
      );
      return;
    }

    const bridge: BridgeSpan = {
      id: bridgeIdFor(dentition, normalizedSelectedBridgeTeeth),
      dentition,
      teeth: normalizedSelectedBridgeTeeth,
    };
    commitBridges((current) => [
      ...current.filter(
        (item) =>
          item.dentition !== dentition ||
          !item.teeth.some((tooth) => bridge.teeth.includes(tooth)),
      ),
      bridge,
    ]);
  };

  const toggleQuickDiagnosis = (groupId: string, value: string) => {
    if (readOnly || !quickDiagnosisScope) {
      return;
    }

    saveHistory();
    commitQuickDiagnosis((current) => {
      const next = {
        both: { ...current.both },
        upper: { ...current.upper },
        lower: { ...current.lower },
        notes: { ...current.notes },
      };

      if (next[quickDiagnosisScope][groupId] === value) {
        delete next[quickDiagnosisScope][groupId];
      } else {
        next[quickDiagnosisScope][groupId] = value;
      }

      return next;
    });
  };

  const updateAssessmentNote = (value: string) => {
    if (readOnly || !quickDiagnosisScope) {
      return;
    }

    const nextValue = value.slice(0, 500);
    commitQuickDiagnosis((current) => ({
      ...current,
      notes: {
        ...current.notes,
        [quickDiagnosisScope]: nextValue,
      },
    }));
  };

  const undo = () => {
    if (readOnly) return;
    const last = history.at(-1);
    if (!last) return;

    commitSurfaceState(() => last.surfaceState);
    commitAnatomyState(() => last.anatomyState);
    commitMarkerState(() => last.markerState);
    commitMarkerTargetState(() => last.markerTargetState);
    commitBridges(() => last.bridges);
    commitQuickDiagnosis(() => last.quickDiagnosis);
    setHistory((current) => current.slice(0, -1));
  };

  const reset = () => {
    if (readOnly) return;
    const label = dentition === "adult" ? "răng vĩnh viễn" : "răng sữa";
    if (
      (markedSurfaceCount === 0 &&
        markedAnatomyCount === 0 &&
        markedMarkerCount === 0 &&
        activeBridges.length === 0 &&
        quickDiagnosisCount === 0) ||
      !window.confirm(`Xóa toàn bộ đánh dấu của bộ ${label}?`)
    ) {
      return;
    }
    saveHistory();
    commitSurfaceState((current) =>
      Object.fromEntries(
        Object.entries(current).filter(
          ([key]) => !activeToothSet.has(key.split(".")[0] as ToothId),
        ),
      ) as SurfaceState,
    );
    commitAnatomyState((current) =>
      Object.fromEntries(
        Object.entries(current).filter(
          ([key]) => !activeToothSet.has(key.split(".")[0] as ToothId),
        ),
      ) as AnatomyState,
    );
    commitMarkerState((current) =>
      Object.fromEntries(
        Object.entries(current).filter(
          ([key]) => !activeToothSet.has(key.split(".")[0] as ToothId),
        ),
      ) as MarkerState,
    );
    commitMarkerTargetState((current) =>
      Object.fromEntries(
        Object.entries(current).filter(
          ([key]) => !activeToothSet.has(key.split(".")[0] as ToothId),
        ),
      ) as MarkerTargetState,
    );
    commitBridges((current) =>
      current.filter((bridge) => bridge.dentition !== dentition),
    );
    commitQuickDiagnosis(() => emptyQuickDiagnosis());
  };

  const copyData = async () => {
    const payload = JSON.stringify(
      buildExportData(
        activeSurfaceState,
        activeAnatomyState,
        activeMarkerState,
        markerTargetState,
        activeBridges,
        quickDiagnosis,
        dentition,
      ),
      null,
      2,
    );
    await navigator.clipboard.writeText(payload);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const selectDentition = (nextDentition: Dentition) => {
    if (nextDentition === dentition) {
      return;
    }

    setDentition(nextDentition);
    setSelectedTeeth([]);
    setSelectedAnatomyZone(null);
    setHistory([]);
    setCopied(false);
  };

  return (
    <AssetBaseContext.Provider value={assetBaseUrl}>
    <main className={`${styles.shell} ${embedded ? styles.embedded : ""}`}>
      {!embedded ? <header className={styles.header}>
        <a className={styles.brand} href={brandHref}>
          <img src={logoUrl} alt="" />
          <span>
            <strong>Codexdentist</strong>
            <small>Clinical Lab</small>
          </span>
        </a>
        <div className={styles.titleBlock}>
          <span className={styles.statusDot} />
          <div>
            <h1>Odontogram 5 mặt</h1>
            <p>
              FDI · {dentition === "adult" ? "Răng vĩnh viễn" : "Răng sữa"}
            </p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.savedState}>
            <Check size={14} />
            {readOnly ? "Chỉ đọc" : "Sẵn sàng đồng bộ"}
          </span>
          <button
            className={styles.iconButton}
            type="button"
            onClick={undo}
            disabled={readOnly || history.length === 0}
            aria-label="Hoàn tác"
            title="Hoàn tác"
          >
            <Undo2 size={18} />
          </button>
          <button
            className={styles.iconButton}
            type="button"
            onClick={reset}
            disabled={
              readOnly ||
              markedSurfaceCount === 0 &&
              markedAnatomyCount === 0 &&
              markedMarkerCount === 0 &&
              activeBridges.length === 0 &&
              quickDiagnosisCount === 0
            }
            aria-label="Xóa toàn bộ"
            title="Xóa toàn bộ"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </header> : null}

      {beforeToolbar}

      <section className={styles.toolbar} aria-label="Trạng thái bề mặt">
        <div className={styles.toolbarControls}>
          <div className={styles.dentitionControl} aria-label="Loại bộ răng">
            <button
              type="button"
              className={dentition === "adult" ? styles.dentitionActive : undefined}
              onClick={() => selectDentition("adult")}
              aria-pressed={dentition === "adult"}
            >
              Răng vĩnh viễn
            </button>
            <button
              type="button"
              className={dentition === "primary" ? styles.dentitionActive : undefined}
              onClick={() => selectDentition("primary")}
              aria-pressed={dentition === "primary"}
            >
              Răng sữa
            </button>
          </div>
          <button
            type="button"
            className={styles.quickDiagnosisButton}
            onClick={() => setQuickDiagnosisScope("both")}
          >
            <ClipboardList size={16} />
            Đánh giá tổng quát
            {quickDiagnosisCount > 0 ? <strong>{quickDiagnosisCount}</strong> : null}
          </button>
          <div className={styles.conditionControl}>
            {conditionOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                className={
                  condition === option.id ? styles.conditionActive : undefined
                }
                onClick={() => setCondition(option.id)}
                aria-pressed={condition === option.id}
                disabled={readOnly}
              >
                <span style={{ backgroundColor: option.color }} />
                <span className={styles.fullLabel}>{option.label}</span>
                <span className={styles.shortLabel}>{option.shortLabel}</span>
              </button>
            ))}
          </div>
        </div>
        <div className={styles.toolbarStats}>
          <span><strong>{markedToothCount}</strong> răng</span>
          <span><strong>{markedSurfaceCount}</strong> mặt</span>
          <span><strong>{markedAnatomyCount}</strong> vùng</span>
          <span><strong>{markedMarkerCount}</strong> dấu</span>
          <span><strong>{activeBridges.length}</strong> cầu</span>
        </div>
      </section>

      <div className={styles.workspace}>
        <section className={styles.chartPanel} aria-label="Sơ đồ răng">
          {quickDiagnosisSummary(quickDiagnosis, "both").length > 0 ? (
            <button
              type="button"
              className={styles.interarchSummary}
              onClick={() => setQuickDiagnosisScope("both")}
            >
              <span>Đánh giá tổng quát</span>
              <strong>
                {quickDiagnosisSummary(quickDiagnosis, "both").join(" · ")}
              </strong>
            </button>
          ) : null}
          <div className={styles.orientation}>
            <span>Phải bệnh nhân</span>
            <span>Đường giữa</span>
            <span>Trái bệnh nhân</span>
          </div>

          <Arch
            label="Hàm trên"
            teeth={upperTeeth}
            selectedTeeth={selectedTeeth}
            state={surfaceState}
            anatomyState={anatomyState}
            markerState={markerState}
            markerTargetState={markerTargetState}
            bridges={activeBridges}
            readOnly={readOnly}
            selectedAnatomyZone={selectedAnatomyZone}
            diagnosisSummary={quickDiagnosisSummary(quickDiagnosis, "upper")}
            condition={condition}
            onOpenDiagnosis={() => setQuickDiagnosisScope("upper")}
            onSelectTooth={selectTooth}
            onToggleAnatomy={toggleAnatomy}
            onClearAnatomy={clearAnatomy}
            onSetSurface={setSurface}
            onClearSurface={clearSurface}
          />

          <div className={styles.occlusalPlane}>
            <span />
            <strong>Mặt phẳng cắn</strong>
            <span />
          </div>

          <Arch
            label="Hàm dưới"
            teeth={lowerTeeth}
            selectedTeeth={selectedTeeth}
            state={surfaceState}
            anatomyState={anatomyState}
            markerState={markerState}
            markerTargetState={markerTargetState}
            bridges={activeBridges}
            readOnly={readOnly}
            selectedAnatomyZone={selectedAnatomyZone}
            diagnosisSummary={quickDiagnosisSummary(quickDiagnosis, "lower")}
            condition={condition}
            onOpenDiagnosis={() => setQuickDiagnosisScope("lower")}
            onSelectTooth={selectTooth}
            onToggleAnatomy={toggleAnatomy}
            onClearAnatomy={clearAnatomy}
            onSetSurface={setSurface}
            onClearSurface={clearSurface}
          />
        </section>

        <aside className={styles.inspector}>
          <div className={styles.inspectorHeading}>
            <div>
              <span>
                {selectedTeeth.length === 0
                  ? "Lựa chọn"
                  : selectedTeeth.length > 1
                  ? `${selectedTeeth.length} răng đang chọn`
                  : "Răng đang chọn"}
              </span>
              <h2>
                {selectedTeeth.length === 0
                  ? "Chưa chọn răng"
                  : selectedTeeth.length > 1
                  ? displayedSelectedTeeth.join(" · ")
                  : `R${selectedTooth}`}
              </h2>
            </div>
            <strong>
              {selectedTeeth.length === 0
                ? "0 răng"
                : selectedTeeth.length > 1
                ? "Chọn theo nhóm"
                : hasMarker(markerState, previewTooth, "implant") &&
              hasMarker(markerState, previewTooth, "crown")
                ? "Implant + Mão"
                : hasMarker(markerState, previewTooth, "missing")
                ? "Mất răng"
                : hasMarker(markerState, previewTooth, "implant")
                  ? "Implant"
                  : toothType(previewTooth)}
            </strong>
          </div>

          {selectedTeeth.length > 0 && selectedAnatomyZone ? (
            <div className={styles.selectionScope}>
              <span>Phạm vi đang chọn</span>
              <strong>
                {anatomyNames[selectedAnatomyZone]} ·{" "}
                {displayedSelectedTeeth.map((tooth) => `R${tooth}`).join(", ")}
              </strong>
              <button
                type="button"
                onClick={() => setSelectedAnatomyZone(null)}
              >
                Toàn răng
              </button>
            </div>
          ) : null}

          {selectedTeeth.length === 0 ? (
            <div className={styles.multiSelectionSummary}>
              <span>Chưa chọn răng</span>
            </div>
          ) : selectedTeeth.length > 1 ? (
            <div className={styles.multiSelectionSummary}>
              {displayedSelectedTeeth.map((tooth) => (
                <button
                  type="button"
                  key={tooth}
                  onClick={() => selectTooth(tooth)}
                  aria-label={`Bỏ chọn răng ${tooth}`}
                >
                  R{tooth}
                </button>
              ))}
            </div>
          ) : (
            <>
              <div className={styles.focusTooth}>
                <SurfaceMap
                  tooth={previewTooth}
                  state={surfaceState}
                  condition={condition}
                  large
                  disabled={readOnly || selectedToothUnavailable}
                  onSetSurface={setSurface}
                  onClearSurface={clearSurface}
                />
              </div>

              <div className={styles.surfaceList}>
                {selectedRows.map(({ surface, condition: surfaceCondition }) => (
                  <button
                    key={surface}
                    type="button"
                    disabled={readOnly || selectedToothUnavailable}
                    onClick={() => setSurface(previewTooth, surface)}
                  >
                    <span className={styles.surfaceCode}>{surface}</span>
                    <span>
                      <strong>{surfaceNames[surface]}</strong>
                      <small>
                        {conditionFor(surfaceCondition)?.label ?? "Chưa đánh dấu"}
                      </small>
                    </span>
                    {surfaceCondition ? (
                      <i style={{ backgroundColor: conditionFor(surfaceCondition)?.color }} />
                    ) : null}
                  </button>
                ))}
              </div>
            </>
          )}

          <div className={styles.clinicalMarkers}>
            <div className={styles.clinicalMarkersHeading}>
              <span>Ký hiệu lâm sàng</span>
              <strong>
                {
                  clinicalMarkerOptions.filter(
                    (marker) =>
                      selectedTeeth.some(
                        (tooth) =>
                          markerState[markerKey(tooth, marker.id)] === true,
                      ),
                  ).length + (selectedBridge ? 1 : 0)
                }
              </strong>
            </div>
            <div className={styles.clinicalMarkerGrid}>
              {clinicalMarkerOptions.map((marker) => {
                const expectedTarget = markerTargetForSelection(
                  marker.id,
                  selectedAnatomyZone,
                );
                const activeCount = selectedTeeth.filter(
                  (tooth) => {
                    const key = markerKey(tooth, marker.id);
                    return (
                      markerState[key] === true &&
                      (markerTargetState[key] ?? marker.defaultTarget) ===
                        expectedTarget
                    );
                  },
                ).length;
                const active =
                  selectedTeeth.length > 0 &&
                  activeCount === selectedTeeth.length;
                const partial = activeCount > 0 && !active;
                const markerTargets =
                  marker.targets as readonly MarkerTarget[];
                const compatibleWithSelection =
                  !selectedAnatomyZone ||
                  markerTargets.includes("tooth") ||
                  markerTargets.includes(selectedAnatomyZone);

                return (
                  <button
                    key={marker.id}
                    type="button"
                    className={
                      active
                        ? styles.clinicalMarkerActive
                        : partial
                          ? styles.clinicalMarkerPartial
                          : undefined
                    }
                    onClick={() => toggleMarker(marker.id)}
                    aria-pressed={partial ? "mixed" : active}
                    disabled={
                      readOnly ||
                      selectedTeeth.length === 0 ||
                      !compatibleWithSelection
                    }
                    title={
                      compatibleWithSelection
                        ? `Áp dụng ${marker.label} cho ${
                            selectedAnatomyZone
                              ? anatomyNames[selectedAnatomyZone].toLowerCase()
                              : "răng đang chọn"
                          }`
                        : `${marker.label} không áp dụng cho ${anatomyNames[
                            selectedAnatomyZone!
                          ].toLowerCase()}`
                    }
                  >
                    <ClinicalMarkerPreview
                      tooth={previewTooth}
                      marker={marker.id}
                      color={marker.color}
                    />
                    <span>{marker.label}</span>
                  </button>
                );
              })}
              <button
                type="button"
                className={
                  selectedBridge ? styles.clinicalMarkerActive : undefined
                }
                onClick={toggleBridge}
                disabled={readOnly || !bridgeAvailable}
                aria-pressed={Boolean(selectedBridge)}
                title={
                  bridgeAvailable
                    ? "Tạo hoặc xóa cầu trên các răng đang chọn"
                    : "Chọn ít nhất 2 răng liền nhau trên cùng một hàm"
                }
              >
                <BridgePreview />
                <span>Cầu răng</span>
              </button>
            </div>
          </div>

          <div className={styles.inspectorActions}>
            <button
              type="button"
              onClick={copyData}
              disabled={
                markedSurfaceCount === 0 &&
                markedAnatomyCount === 0 &&
                markedMarkerCount === 0 &&
                activeBridges.length === 0 &&
                quickDiagnosisCount === 0
              }
            >
              {copied ? <Check size={17} /> : <Clipboard size={17} />}
              {copied ? "Đã sao chép" : "Sao chép JSON"}
            </button>
            <button
              type="button"
              onClick={() =>
                downloadJson(
                  activeSurfaceState,
                  activeAnatomyState,
                  activeMarkerState,
                  markerTargetState,
                  activeBridges,
                  quickDiagnosis,
                  dentition,
                )
              }
              disabled={
                markedSurfaceCount === 0 &&
                markedAnatomyCount === 0 &&
                markedMarkerCount === 0 &&
                activeBridges.length === 0 &&
                quickDiagnosisCount === 0
              }
            >
              <Download size={17} />
              Tải JSON
            </button>
          </div>
        </aside>
      </div>

      {!embedded ? <footer className={styles.footer}>
        <span>MODBL · FDI surface model</span>
        <span>Prototype · Không dùng thay thế chẩn đoán lâm sàng</span>
      </footer> : null}

      {quickDiagnosisScope ? (
        <div
          className={styles.quickDiagnosisBackdrop}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setQuickDiagnosisScope(null);
            }
          }}
        >
          <section
            className={styles.quickDiagnosisDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="quick-diagnosis-title"
          >
            <header>
              <div>
                <span>Tình trạng toàn miệng và cung hàm</span>
                <h2 id="quick-diagnosis-title">Đánh giá tổng quát</h2>
              </div>
              <button
                type="button"
                onClick={() => setQuickDiagnosisScope(null)}
                aria-label="Đóng"
                title="Đóng"
              >
                <X size={18} />
              </button>
            </header>

            <div
              className={styles.quickDiagnosisScopes}
              aria-label="Phạm vi đánh giá"
            >
              {([
                ["both", "Toàn miệng"],
                ["upper", "Hàm trên"],
                ["lower", "Hàm dưới"],
              ] as const).map(([scope, label]) => (
                <button
                  type="button"
                  key={scope}
                  className={
                    quickDiagnosisScope === scope
                      ? styles.quickDiagnosisScopeActive
                      : undefined
                  }
                  onClick={() => setQuickDiagnosisScope(scope)}
                  aria-pressed={quickDiagnosisScope === scope}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className={styles.quickDiagnosisGroups}>
              {quickDiagnosisGroups[quickDiagnosisScope].map((group) => (
                <fieldset key={group.id}>
                  <legend>{group.label}</legend>
                  <div>
                    {group.options.map((option) => {
                      const active =
                        quickDiagnosis[quickDiagnosisScope][group.id] ===
                        option.value;
                      return (
                        <button
                          type="button"
                          key={option.value}
                          className={
                            active
                              ? styles.quickDiagnosisOptionActive
                              : undefined
                          }
                          onClick={() =>
                            toggleQuickDiagnosis(group.id, option.value)
                          }
                          aria-pressed={active}
                          disabled={readOnly}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              ))}
              <label className={styles.assessmentNote}>
                <span>Nhận xét khác</span>
                <textarea
                  disabled={readOnly}
                  maxLength={500}
                  onChange={(event) => updateAssessmentNote(event.target.value)}
                  onFocus={saveHistory}
                  placeholder="Ghi nhận ngắn gọn những tình trạng chưa có trong danh sách"
                  rows={3}
                  value={quickDiagnosis.notes[quickDiagnosisScope]}
                />
                <small>
                  {quickDiagnosis.notes[quickDiagnosisScope].length}/500
                </small>
              </label>
            </div>
          </section>
        </div>
      ) : null}
    </main>
    </AssetBaseContext.Provider>
  );
}

function Arch({
  label,
  teeth,
  selectedTeeth,
  state,
  anatomyState,
  markerState,
  markerTargetState,
  bridges,
  readOnly,
  selectedAnatomyZone,
  diagnosisSummary,
  condition,
  onOpenDiagnosis,
  onSelectTooth,
  onToggleAnatomy,
  onClearAnatomy,
  onSetSurface,
  onClearSurface,
}: {
  label: string;
  teeth: readonly ToothId[];
  selectedTeeth: ToothId[];
  state: SurfaceState;
  anatomyState: AnatomyState;
  markerState: MarkerState;
  markerTargetState: MarkerTargetState;
  bridges: BridgeSpan[];
  readOnly: boolean;
  selectedAnatomyZone: AnatomyZone | null;
  diagnosisSummary: string[];
  condition: ConditionId;
  onOpenDiagnosis: () => void;
  onSelectTooth: (tooth: ToothId) => void;
  onToggleAnatomy: (tooth: ToothId, zone: AnatomyZone) => void;
  onClearAnatomy: (tooth: ToothId, zone: AnatomyZone) => void;
  onSetSurface: (tooth: ToothId, surface: SurfaceCode) => void;
  onClearSurface: (tooth: ToothId, surface: SurfaceCode) => void;
}) {
  const upper = isUpperTooth(teeth[0]);
  const primary = isPrimaryTooth(teeth[0]);

  return (
    <section className={upper ? styles.arch : `${styles.arch} ${styles.lowerArch}`}>
      <button
        type="button"
        className={styles.archLabel}
        onClick={onOpenDiagnosis}
      >
        <span>{label}</span>
        {diagnosisSummary.length > 0 ? (
          <strong>{diagnosisSummary.join(" · ")}</strong>
        ) : null}
      </button>
      <div
        className={`${styles.teethRow} ${
          primary ? styles.teethRowPrimary : ""
        }`}
      >
        {teeth.map((tooth, index) => {
          const bridge = bridges.find((item) => item.teeth.includes(tooth));
          const bridgeIndex = bridge?.teeth.indexOf(tooth) ?? -1;
          const figure = (
            <ToothIllustration
              tooth={tooth}
              anatomyState={anatomyState}
              markerState={markerState}
              markerTargetState={markerTargetState}
              condition={condition}
              readOnly={readOnly}
              selectedAnatomyZone={
                selectedTeeth.includes(tooth) ? selectedAnatomyZone : null
              }
              onToggleAnatomy={onToggleAnatomy}
              onClearAnatomy={onClearAnatomy}
              bridgeUnit={
                bridge
                  ? {
                      first: bridgeIndex === 0,
                      last: bridgeIndex === bridge.teeth.length - 1,
                    }
                  : undefined
              }
            />
          );
          const number = (
            <button
              className={styles.toothNumber}
              type="button"
              onClick={() => onSelectTooth(tooth)}
              aria-label={`Chọn răng ${tooth}`}
              aria-pressed={selectedTeeth.includes(tooth)}
            >
              {tooth}
            </button>
          );
          const surfaceMap = (
            <SurfaceMap
              tooth={tooth}
              state={state}
              condition={condition}
              disabled={
                readOnly || isToothUnavailable(markerState, tooth)
              }
              onSetSurface={onSetSurface}
              onClearSurface={onClearSurface}
            />
          );

          return (
            <div
              className={`${styles.toothCell} ${
                selectedTeeth.includes(tooth) ? styles.toothSelected : ""
              } ${
                index === teeth.length / 2 - 1 ? styles.beforeMidline : ""
              }`}
              key={tooth}
            >
              {upper ? (
                <>
                  {figure}
                  {number}
                  {surfaceMap}
                </>
              ) : (
                <>
                  {surfaceMap}
                  {number}
                  {figure}
                </>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ToothIllustration({
  tooth,
  anatomyState,
  markerState,
  markerTargetState,
  condition,
  readOnly,
  selectedAnatomyZone,
  onToggleAnatomy,
  onClearAnatomy,
  bridgeUnit,
}: {
  tooth: ToothId;
  anatomyState: AnatomyState;
  markerState: MarkerState;
  markerTargetState: MarkerTargetState;
  condition: ConditionId;
  readOnly: boolean;
  selectedAnatomyZone: AnatomyZone | null;
  onToggleAnatomy: (tooth: ToothId, zone: AnatomyZone) => void;
  onClearAnatomy: (tooth: ToothId, zone: AnatomyZone) => void;
  bridgeUnit?: {
    first: boolean;
    last: boolean;
  };
}) {
  const assetBaseUrl = useContext(AssetBaseContext);
  const lower = !isUpperTooth(tooth);
  const patientLeft = isPatientLeft(tooth);
  const artworkTransform = `scale(${patientLeft ? -1 : 1}, ${
    lower ? -1 : 1
  })`;
  const activeMarkers = clinicalMarkerOptions
    .filter((marker) => markerState[markerKey(tooth, marker.id)] === true)
    .map((marker) => marker.id);
  const missing = activeMarkers.includes("missing");
  const implant = activeMarkers.includes("implant");
  const anatomyDisabled = readOnly || missing || implant;
  const boneLoss = activeMarkers.includes("boneLoss");
  const nativeMarkers = activeMarkers.filter(
    (marker): marker is NativeMarkerId => nativeMarkerIds.has(marker),
  );
  const artworkVariant = missing
    ? boneLoss
      ? "boneLossOnly"
      : "bone"
    : implant
      ? boneLoss
        ? "implantBoneLoss"
        : "implant"
      : boneLoss
        ? "boneLoss"
        : undefined;
  const anatomyGeometry = toothAnatomyGeometry(tooth);
  const anatomyClipId = `tooth-anatomy-${tooth}`;

  return (
    <div
      className={`${styles.toothIllustration} ${
        isPrimaryTooth(tooth) ? styles.primaryToothIllustration : ""
      }`}
      data-tooth={tooth}
      role="group"
      aria-label={`${toothType(tooth)} ${tooth}${
        activeMarkers.length > 0
          ? `, ${activeMarkers
              .map((marker) => markerFor(marker)?.label)
              .join(", ")}`
          : ""
      }${bridgeUnit ? ", Cầu răng" : ""}`}
    >
      <img
        className={styles.toothArtwork}
        src={toothArtworkPath(tooth, assetBaseUrl, artworkVariant)}
        alt=""
        aria-hidden="true"
        draggable={false}
        style={{ transform: artworkTransform }}
      />
      {!missing && !implant ? (
        <svg
          className={styles.toothAnatomyMap}
          viewBox={`0 0 ${anatomyGeometry.width} ${anatomyGeometry.height}`}
          role="group"
          aria-label={`Chọn thân hoặc chân răng ${tooth}`}
          style={{ transform: artworkTransform }}
        >
          <defs>
            <clipPath id={`${anatomyClipId}-outline`}>
              <path d={anatomyGeometry.outline} />
            </clipPath>
            {(["root", "crown"] as const).map((zone) => (
              <clipPath id={`${anatomyClipId}-${zone}`} key={zone}>
                <path d={anatomyClipPath(anatomyGeometry, zone)} />
              </clipPath>
            ))}
          </defs>
          {(["root", "crown"] as const).map((zone) => {
            const current = anatomyState[anatomyKey(tooth, zone)];
            const currentCondition = conditionFor(current);
            const label = `${anatomyNames[zone]} ${tooth}${
              currentCondition ? `, ${currentCondition.label}` : ""
            }. Chọn ${conditionFor(condition)?.label}.`;
            const zonePath = anatomyClipPath(anatomyGeometry, zone);

            return (
              <g key={zone}>
                <path
                  className={styles.toothAnatomyZone}
                  data-active={current ? "true" : "false"}
                  data-selected={selectedAnatomyZone === zone ? "true" : "false"}
                  data-zone={zone}
                  d={zonePath}
                  clipPath={`url(#${anatomyClipId}-outline)`}
                  vectorEffect="non-scaling-stroke"
                  style={
                    currentCondition
                      ? {
                          fill: `${currentCondition.color}38`,
                          stroke: currentCondition.color,
                        }
                      : undefined
                  }
                  role="button"
                  tabIndex={anatomyDisabled ? -1 : 0}
                  aria-disabled={anatomyDisabled}
                  aria-label={label}
                  aria-pressed={Boolean(current)}
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleAnatomy(tooth, zone);
                  }}
                  onContextMenu={(event) => {
                    event.preventDefault();
                    onClearAnatomy(tooth, zone);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onToggleAnatomy(tooth, zone);
                    }
                    if (event.key === "Delete" || event.key === "Backspace") {
                      event.preventDefault();
                      onClearAnatomy(tooth, zone);
                    }
                  }}
                >
                  <title>{`${anatomyNames[zone]} ${tooth}`}</title>
                </path>
                <path
                  className={styles.toothAnatomyContour}
                  d={anatomyGeometry.outline}
                  clipPath={`url(#${anatomyClipId}-${zone})`}
                  vectorEffect="non-scaling-stroke"
                  style={
                    currentCondition
                      ? { stroke: currentCondition.color }
                      : undefined
                  }
                  aria-hidden="true"
                />
              </g>
            );
          })}
        </svg>
      ) : null}
      {bridgeUnit ? (
        <>
          <span
            className={`${styles.bridgeConnector} ${
              bridgeUnit.first ? styles.bridgeConnectorFirst : ""
            } ${bridgeUnit.last ? styles.bridgeConnectorLast : ""} ${
              lower ? styles.bridgeConnectorLower : ""
            }`}
            aria-hidden="true"
          />
          <img
            className={`${styles.toothClinicalArtwork} ${styles.bridgeCrown}`}
            src={toothArtworkPath(tooth, assetBaseUrl, "crown")}
            alt=""
            aria-hidden="true"
            draggable={false}
            style={{ transform: artworkTransform }}
          />
        </>
      ) : null}
      {!missing
        ? nativeMarkers.map((marker) => (
            <img
              className={styles.toothClinicalArtwork}
              src={toothArtworkPath(tooth, assetBaseUrl, marker)}
              alt=""
              aria-hidden="true"
              draggable={false}
              key={marker}
              style={{ transform: artworkTransform }}
            />
          ))
        : null}
      {!missing && activeMarkers.includes("fracture") ? (
        <svg
          className={styles.toothInteractionOverlay}
          viewBox="0 0 70 100"
          aria-hidden="true"
        >
          <g transform={lower ? "translate(0 100) scale(1 -1)" : undefined}>
            <g
              transform={patientLeft ? "translate(70 0) scale(-1 1)" : undefined}
            >
              <path
                className={styles.markerFracture}
                d={
                  markerTargetState[markerKey(tooth, "fracture")] === "root"
                    ? "M17 25 L28 29 L23 36 L38 33 L34 42 L52 39"
                    : "M17 67 L28 70 L23 76 L38 73 L34 81 L52 78"
                }
              />
            </g>
          </g>
        </svg>
      ) : null}
    </div>
  );
}

function ClinicalMarkerPreview({
  tooth,
  marker,
  color,
}: {
  tooth: ToothId;
  marker: ClinicalMarkerId;
  color: string;
}) {
  const assetBaseUrl = useContext(AssetBaseContext);
  const lower = !isUpperTooth(tooth);
  const patientLeft = isPatientLeft(tooth);
  const artworkTransform = `scale(${patientLeft ? -1 : 1}, ${
    lower ? -1 : 1
  })`;

  if (marker === "boneLoss") {
    return (
      <span className={styles.clinicalMarkerPreview} aria-hidden="true">
        <img
          src={toothArtworkPath(tooth, assetBaseUrl, "boneLoss")}
          alt=""
          draggable={false}
          style={{ transform: artworkTransform }}
        />
      </span>
    );
  }

  if (marker === "missing" || marker === "fracture") {
    return (
      <span className={styles.clinicalMarkerPreview} aria-hidden="true">
        <svg viewBox="0 0 32 38">
          {marker === "missing" ? (
            <>
              <path
                className={styles.markerPreviewTooth}
                d="M8 5 C10 2 13 4 16 5 C19 4 22 2 24 5 C27 9 24 16 22 22 C20 29 19 34 16 35 C13 34 12 29 10 22 C8 16 5 9 8 5 Z"
              />
              <path
                className={styles.markerPreviewAccent}
                d="M6 7 L26 31 M26 7 L6 31"
                style={{ stroke: color }}
              />
            </>
          ) : (
            <>
              <path
                className={styles.markerPreviewTooth}
                d="M8 5 C10 2 13 4 16 5 C19 4 22 2 24 5 C27 9 24 16 22 22 C20 29 19 34 16 35 C13 34 12 29 10 22 C8 16 5 9 8 5 Z"
              />
              <path
                className={styles.markerPreviewAccent}
                d="M7 19 H13 L10 25 L21 13 L18 21 H25"
                style={{ stroke: color }}
              />
            </>
          )}
        </svg>
      </span>
    );
  }

  const variant = marker === "implant" ? "implant" : marker;

  return (
    <span className={styles.clinicalMarkerPreview} aria-hidden="true">
      {marker !== "implant" ? (
        <img
          src={toothArtworkPath(tooth, assetBaseUrl)}
          alt=""
          draggable={false}
          style={{ transform: artworkTransform }}
        />
      ) : null}
      <img
        src={toothArtworkPath(tooth, assetBaseUrl, variant)}
        alt=""
        draggable={false}
        style={{ transform: artworkTransform }}
      />
    </span>
  );
}

function BridgePreview() {
  return (
    <span className={styles.clinicalMarkerPreview} aria-hidden="true">
      <svg viewBox="0 0 32 38">
        <path
          className={styles.bridgePreviewConnector}
          d="M4 18 H28"
        />
        <path
          className={styles.bridgePreviewUnit}
          d="M3 10 C5 7 8 8 10 10 L9 24 C8 27 5 27 4 24 Z"
        />
        <path
          className={styles.bridgePreviewUnit}
          d="M12 9 C14 6 18 6 20 9 L19 24 C18 27 14 27 13 24 Z"
        />
        <path
          className={styles.bridgePreviewUnit}
          d="M22 10 C24 7 27 8 29 10 L28 24 C27 27 24 27 23 24 Z"
        />
      </svg>
    </span>
  );
}

function SurfaceMap({
  tooth,
  state,
  condition,
  large = false,
  disabled = false,
  onSetSurface,
  onClearSurface,
}: {
  tooth: ToothId;
  state: SurfaceState;
  condition: ConditionId;
  large?: boolean;
  disabled?: boolean;
  onSetSurface: (tooth: ToothId, surface: SurfaceCode) => void;
  onClearSurface: (tooth: ToothId, surface: SurfaceCode) => void;
}) {
  const layout = surfaceLayout(tooth);
  const ordered = [
    { position: "top", code: layout.top, path: "M 10 10 H 90 L 68 32 H 32 Z" },
    { position: "right", code: layout.right, path: "M 90 10 V 90 L 68 68 V 32 Z" },
    { position: "bottom", code: layout.bottom, path: "M 90 90 H 10 L 32 68 H 68 Z" },
    { position: "left", code: layout.left, path: "M 10 90 V 10 L 32 32 V 68 Z" },
    { position: "center", code: layout.center, path: "M 32 32 H 68 V 68 H 32 Z" },
  ] as const;

  return (
    <svg
      className={`${styles.surfaceMap} ${large ? styles.surfaceMapLarge : ""} ${
        isAnterior(tooth) ? styles.anteriorMap : ""
      } ${disabled ? styles.surfaceMapDisabled : ""}`}
      viewBox="0 0 100 100"
      aria-label={`Răng ${tooth}, năm mặt răng`}
    >
      <rect className={styles.toothBase} x="7" y="7" width="86" height="86" rx="18" />
      {ordered.map(({ position, code, path }) => {
        const current = state[surfaceKey(tooth, code)];
        const currentCondition = conditionFor(current);
        const label = `Răng ${tooth}, mặt ${surfaceNames[code]}${
          currentCondition ? `, ${currentCondition.label}` : ""
        }`;

        return (
          <path
            className={styles.surface}
            data-position={position}
            d={path}
            fill={currentCondition?.color ?? "#ffffff"}
            key={`${position}-${code}`}
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-disabled={disabled}
            aria-label={label}
            onClick={(event) => {
              event.stopPropagation();
              if (disabled) return;
              if (event.shiftKey || event.altKey) {
                onClearSurface(tooth, code);
              } else {
                onSetSurface(tooth, code);
              }
            }}
            onContextMenu={(event) => {
              event.preventDefault();
              if (disabled) return;
              onClearSurface(tooth, code);
            }}
            onKeyDown={(event) => {
              if (disabled) return;
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSetSurface(tooth, code);
              }
              if (event.key === "Delete" || event.key === "Backspace") {
                event.preventDefault();
                onClearSurface(tooth, code);
              }
            }}
          />
        );
      })}
      {large
        ? ordered.map(({ position, code }) => (
            <text
              className={styles.surfaceLabel}
              x={position === "left" ? 20 : position === "right" ? 80 : 50}
              y={position === "top" ? 23 : position === "bottom" ? 83 : 55}
              key={`label-${position}`}
              textAnchor="middle"
            >
              {code}
            </text>
          ))
        : null}
    </svg>
  );
}
