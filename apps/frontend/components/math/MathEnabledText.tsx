"use client";

import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { KaTeXRender } from "@/components/section-preview/katex-render";

type MathEnabledTextProps = {
  text: string;
  className?: string;
  /**
   * Inline mode helps when this component is rendered inside elements like buttons/selects.
   * In inline mode we render markdown paragraphs as spans.
   */
  variant?: "inline" | "block";
};

function looksLikeRawLatex(s: string) {
  const t = s.trim();
  if (!t) return false;
  // If it's already delimited for markdown-math/rehype-katex, let the markdown pipeline handle it.
  if (t.includes("$") || t.includes("\\(") || t.includes("\\[")) return false;
  // For this app, math-input answers currently store "raw" expressions like `\frac{1}{2}`.
  // We'll support those when the entire string looks like a LaTeX expression.
  return /^\\/.test(t);
}

export function MathEnabledText({ text, className, variant = "block" }: MathEnabledTextProps) {
  const t = text ?? "";
  const inline = variant === "inline";
  // Without `remark-breaks`, ReactMarkdown only preserves newlines when they become Markdown hard breaks.
  // Two trailing spaces before `\n` produces `<br/>`.
  const md = t.replace(/\n/g, "  \n");

  if (looksLikeRawLatex(t)) {
    const RawWrapper: React.ElementType = inline ? "span" : "div";
    return (
      <RawWrapper className={className}>
        <KaTeXRender latex={t} />
      </RawWrapper>
    );
  }

  const Wrapper: React.ElementType = inline ? "span" : "div";

  return (
    <Wrapper className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ children }) =>
            // No extra paragraph margins; let parents control spacing.
            inline ? (
              <span className="m-0">{children}</span>
            ) : (
              <p className="m-0 leading-relaxed">{children}</p>
            ),
        }}
      >
        {md}
      </ReactMarkdown>
    </Wrapper>
  );
}

