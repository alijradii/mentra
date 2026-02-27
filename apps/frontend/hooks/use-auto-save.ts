import { useRef, useCallback, useEffect, useState } from "react";

export type AutoSaveStatus = "idle" | "saving" | "saved" | "error";

export function useAutoSave(delay = 1500) {
  const [status, setStatus] = useState<AutoSaveStatus>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveFnRef = useRef<(() => Promise<void>) | null>(null);

  const trigger = useCallback(
    (saveFn: () => Promise<void>) => {
      saveFnRef.current = saveFn;
      if (timerRef.current) clearTimeout(timerRef.current);
      setStatus("idle");
      timerRef.current = setTimeout(async () => {
        timerRef.current = null;
        setStatus("saving");
        try {
          await saveFnRef.current!();
          setStatus("saved");
        } catch {
          setStatus("error");
        }
      }, delay);
    },
    [delay]
  );

  const flush = useCallback(async () => {
    if (timerRef.current && saveFnRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      setStatus("saving");
      try {
        await saveFnRef.current();
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { status, trigger, flush };
}
