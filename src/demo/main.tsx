import { StrictMode, useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  StagedOdontogram,
  type OdontogramData,
  type OdontogramStagesData,
  type StagedOdontogramChange,
} from "../index";
import "./demo.css";

const storageKey = "codexdentist-odontogram-demo-stages-v2";
const legacyStorageKey = "codexdentist-odontogram-demo-v1";
const parentOrigin =
  new URLSearchParams(window.location.search).get("parentOrigin") ??
  window.location.origin;

function blankSnapshot(): OdontogramData {
  return {
    version: 2,
    entries: [],
    generalAssessment: {
      both: {},
      upper: {},
      lower: {},
      notes: {
        both: "",
        upper: "",
        lower: "",
      },
    },
  };
}

function readStoredStages(): OdontogramStagesData {
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (stored) {
      return parseStages(JSON.parse(stored));
    }

    const legacy = window.localStorage.getItem(legacyStorageKey);
    const snapshot = legacy
      ? (JSON.parse(legacy) as OdontogramData)
      : blankSnapshot();
    const migrated = {
      INITIAL: snapshot,
      EXPECTED: null,
      CURRENT: snapshot,
    } satisfies OdontogramStagesData;
    persistStages(migrated);
    return migrated;
  } catch {
    const snapshot = blankSnapshot();
    return {
      INITIAL: snapshot,
      EXPECTED: null,
      CURRENT: snapshot,
    };
  }
}

function Demo() {
  const [defaultStages, setDefaultStages] =
    useState<OdontogramStagesData>(readStoredStages);
  const [instanceKey, setInstanceKey] = useState(0);

  const handleChange = useCallback((change: StagedOdontogramChange) => {
    persistStages(change.stages);
    window.parent.postMessage(
      {
        type: "codexdentist:odontogram-change",
        data: change.data,
        stage: change.stage,
        stages: change.stages,
      },
      parentOrigin,
    );
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (
        event.origin !== parentOrigin ||
        event.data?.type !== "codexdentist:odontogram-set"
      ) {
        return;
      }

      const nextStages = event.data.stages
        ? parseStages(event.data.stages)
        : migrateSingleSnapshot(event.data.data as OdontogramData);
      persistStages(nextStages);
      setDefaultStages(nextStages);
      setInstanceKey((current) => current + 1);
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <StagedOdontogram
      assetBaseUrl="/odontogram-assets"
      brandHref="https://codexdentist.com"
      defaultStages={defaultStages}
      key={instanceKey}
      logoUrl="/icons/codexmed-icon.svg"
      onStagesChange={handleChange}
    />
  );
}

function parseStages(value: unknown): OdontogramStagesData {
  const stages =
    value && typeof value === "object" && "stages" in value
      ? (value as { stages: Partial<OdontogramStagesData> }).stages
      : (value as Partial<OdontogramStagesData>);
  const initial = stages?.INITIAL ?? blankSnapshot();

  return {
    INITIAL: initial,
    EXPECTED: stages?.EXPECTED ?? null,
    CURRENT: stages?.CURRENT ?? initial,
  };
}

function migrateSingleSnapshot(snapshot: OdontogramData): OdontogramStagesData {
  return {
    INITIAL: snapshot,
    EXPECTED: null,
    CURRENT: snapshot,
  };
}

function persistStages(stages: OdontogramStagesData) {
  window.localStorage.setItem(
    storageKey,
    JSON.stringify({ version: 2, stages }),
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Demo />
  </StrictMode>,
);
