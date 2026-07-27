export type OdontogramDentition = "adult" | "primary";
export type OdontogramSurface = "M" | "D" | "B" | "L" | "O" | "I";
export type OdontogramRegion = "crown" | "root";
export type OdontogramTargetScope =
  | "tooth"
  | "surface"
  | "region"
  | "span";
export type OdontogramEntryKind =
  | "condition"
  | "restoration"
  | "procedure"
  | "prosthesis";
export type OdontogramEntryStatus =
  | "observed"
  | "existing"
  | "planned"
  | "monitoring";

export type OdontogramEntryTarget = {
  scope: OdontogramTargetScope;
  teeth: string[];
  surface?: OdontogramSurface;
  region?: OdontogramRegion;
  dentition?: OdontogramDentition;
};

export type OdontogramEntry = {
  id: string;
  conceptId: string;
  kind: OdontogramEntryKind;
  status: OdontogramEntryStatus;
  target: OdontogramEntryTarget;
  attributes?: Record<string, string | number | boolean>;
};

export type GeneralAssessmentScope = "both" | "upper" | "lower";

export type GeneralAssessmentState = {
  both: Record<string, string>;
  upper: Record<string, string>;
  lower: Record<string, string>;
  notes: Record<GeneralAssessmentScope, string>;
};

export type OdontogramData = {
  version: 2;
  entries: OdontogramEntry[];
  generalAssessment: GeneralAssessmentState;
};

export type LegacyOdontogramData = {
  version: 1;
  surfaceState: Record<string, string>;
  anatomyState?: Record<string, string>;
  markerState: Record<string, true>;
  bridges: Array<{
    id?: string;
    dentition: OdontogramDentition;
    teeth: string[];
  }>;
  quickDiagnosis: {
    both: Record<string, string>;
    upper: Record<string, string>;
    lower: Record<string, string>;
  };
};

export type OdontogramDataInput = OdontogramData | LegacyOdontogramData;
