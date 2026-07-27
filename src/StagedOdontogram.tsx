"use client";

import { useCallback, useRef, useState } from "react";
import {
  Odontogram,
  type OdontogramData,
  type OdontogramProps,
} from "./Odontogram";
import styles from "./odontogram.module.css";

export const odontogramStageIds = [
  "INITIAL",
  "EXPECTED",
  "CURRENT",
] as const;

export type OdontogramStage = (typeof odontogramStageIds)[number];
export type OdontogramStagesData = Record<
  OdontogramStage,
  OdontogramData | null
>;
export type StagedOdontogramChange = {
  stage: OdontogramStage;
  data: OdontogramData;
  stages: OdontogramStagesData;
};
export type StagedOdontogramProps = Omit<
  OdontogramProps,
  "beforeToolbar" | "defaultValue" | "onChange"
> & {
  defaultStages?: Partial<OdontogramStagesData>;
  defaultValue?: OdontogramData;
  onStagesChange?: (change: StagedOdontogramChange) => void;
};

const stageLabels: Record<OdontogramStage, string> = {
  INITIAL: "Hiện trạng ban đầu",
  EXPECTED: "Kết quả kỳ vọng",
  CURRENT: "Tiến độ hiện tại",
};

const stageDescriptions: Record<OdontogramStage, string> = {
  INITIAL: "Tình trạng trước khi bắt đầu kế hoạch điều trị.",
  EXPECTED: "Tình trạng mong muốn sau khi hoàn thành điều trị.",
  CURRENT: "Tình trạng thực tế tại thời điểm hiện tại.",
};

export function StagedOdontogram({
  defaultStages,
  defaultValue,
  onSelectionChange,
  onStagesChange,
  ...odontogramProps
}: StagedOdontogramProps) {
  const initialStages = useRef(
    createInitialStages(defaultStages, defaultValue),
  );
  const [stages, setStages] = useState<OdontogramStagesData>(
    initialStages.current,
  );
  const stagesRef = useRef(stages);
  const [activeStage, setActiveStage] =
    useState<OdontogramStage>("INITIAL");
  const [chartVersions, setChartVersions] = useState<
    Record<OdontogramStage, number>
  >({
    INITIAL: 0,
    EXPECTED: 0,
    CURRENT: 0,
  });

  const initialSnapshot = stages.INITIAL;
  const expectedSnapshot = stages.EXPECTED ?? initialSnapshot;
  const currentSnapshot =
    stages.CURRENT ?? expectedSnapshot ?? initialSnapshot;
  const activeSnapshot =
    activeStage === "INITIAL"
      ? initialSnapshot
      : activeStage === "EXPECTED"
        ? expectedSnapshot
        : currentSnapshot;
  const previousSnapshot =
    activeStage === "EXPECTED"
      ? initialSnapshot
      : activeStage === "CURRENT"
        ? expectedSnapshot
        : null;
  const hasInitialStage = initialSnapshot !== null;

  const publishStages = useCallback(
    (
      stage: OdontogramStage,
      data: OdontogramData,
      nextStages: OdontogramStagesData,
    ) => {
      stagesRef.current = nextStages;
      setStages(nextStages);
      onStagesChange?.({ stage, data, stages: nextStages });
    },
    [onStagesChange],
  );

  const handleChange = useCallback(
    (data: OdontogramData) => {
      const current = stagesRef.current;
      const next: OdontogramStagesData = {
        ...current,
        [activeStage]: data,
      };

      if (activeStage === "INITIAL" && current.CURRENT === null) {
        next.CURRENT = data;
      }

      publishStages(activeStage, data, next);
    },
    [activeStage, publishStages],
  );

  const switchStage = (stage: OdontogramStage) => {
    if (
      stage === activeStage ||
      (stage !== "INITIAL" && !hasInitialStage)
    ) {
      return;
    }

    setActiveStage(stage);
    onSelectionChange?.([]);
  };

  const copyPreviousStage = () => {
    if (activeStage === "INITIAL" || !previousSnapshot) {
      return;
    }

    const next = {
      ...stagesRef.current,
      [activeStage]: previousSnapshot,
    };
    publishStages(activeStage, previousSnapshot, next);
    setChartVersions((current) => ({
      ...current,
      [activeStage]: current[activeStage] + 1,
    }));
    onSelectionChange?.([]);
  };

  const stageNavigation = (
    <section className={styles.stagePanel} aria-label="Các mốc điều trị">
      <div className={styles.stageSwitcher} role="tablist">
        {odontogramStageIds.map((stage, index) => (
          <button
            aria-selected={activeStage === stage}
            className={activeStage === stage ? styles.stageActive : undefined}
            data-stage={stage.toLowerCase()}
            disabled={stage !== "INITIAL" && !hasInitialStage}
            key={stage}
            onClick={() => switchStage(stage)}
            role="tab"
            type="button"
          >
            <span>{index + 1}</span>
            {stageLabels[stage]}
          </button>
        ))}
      </div>
      <div className={styles.stageContext} data-stage={activeStage.toLowerCase()}>
        <div>
          <strong>{stageLabels[activeStage]}</strong>
          <span>{stageDescriptions[activeStage]}</span>
        </div>
        <div className={styles.stageContextActions}>
          <span>
            {stages[activeStage] ? "Đã lưu trên trình duyệt" : "Chưa tạo mốc này"}
          </span>
          {activeStage !== "INITIAL" && previousSnapshot ? (
            <button onClick={copyPreviousStage} type="button">
              Sao chép mốc trước
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );

  return (
    <Odontogram
      {...odontogramProps}
      beforeToolbar={stageNavigation}
      defaultValue={activeSnapshot ?? undefined}
      key={`${activeStage}:${chartVersions[activeStage]}`}
      onChange={handleChange}
      onSelectionChange={onSelectionChange}
    />
  );
}

function createInitialStages(
  defaultStages: Partial<OdontogramStagesData> | undefined,
  defaultValue: OdontogramData | undefined,
): OdontogramStagesData {
  const initial = defaultStages?.INITIAL ?? defaultValue ?? null;

  return {
    INITIAL: initial,
    EXPECTED: defaultStages?.EXPECTED ?? null,
    CURRENT: defaultStages?.CURRENT ?? initial,
  };
}
