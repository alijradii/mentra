"use client";

import { useRef, useEffect } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface KaTeXRenderProps {
  latex: string;
}

export function KaTeXRender({ latex }: KaTeXRenderProps) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (ref.current) {
      try {
        katex.render(latex, ref.current, { throwOnError: false, displayMode: false });
      } catch {
        ref.current.textContent = latex;
      }
    }
  }, [latex]);
  return <span ref={ref} />;
}
