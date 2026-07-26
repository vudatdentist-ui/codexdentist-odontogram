import { StrictMode, useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Odontogram, type OdontogramData } from "../index";
import "./demo.css";

const storageKey = "codexdentist-odontogram-demo-v1";
const parentOrigin =
  new URLSearchParams(window.location.search).get("parentOrigin") ??
  window.location.origin;

function readStoredData() {
  try {
    const value = window.localStorage.getItem(storageKey);
    return value ? (JSON.parse(value) as OdontogramData) : undefined;
  } catch {
    return undefined;
  }
}

function Demo() {
  const [defaultValue, setDefaultValue] = useState<OdontogramData | undefined>(
    readStoredData,
  );
  const [instanceKey, setInstanceKey] = useState(0);

  const handleChange = useCallback((data: OdontogramData) => {
    window.localStorage.setItem(storageKey, JSON.stringify(data));
    window.parent.postMessage(
      { type: "codexdentist:odontogram-change", data },
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

      setDefaultValue(event.data.data as OdontogramData);
      setInstanceKey((current) => current + 1);
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <Odontogram
      key={instanceKey}
      defaultValue={defaultValue}
      onChange={handleChange}
      assetBaseUrl="/odontogram-assets"
      brandHref="https://codexdentist.com"
      logoUrl="/icons/codexmed-icon.svg"
    />
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Demo />
  </StrictMode>,
);
