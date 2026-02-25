"use client";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { useSyntaxTheme } from "@/lib/syntax-highlighter-config";
import type { CodeSectionDTO } from "@/lib/api";

interface CodeSectionPreviewProps {
  section: CodeSectionDTO;
}

export function CodeSectionPreview({ section }: CodeSectionPreviewProps) {
  const syntaxTheme = useSyntaxTheme();
  return (
    <SyntaxHighlighter
      language={section.language || "text"}
      style={syntaxTheme}
      showLineNumbers
      customStyle={{ borderRadius: "0.5rem", fontSize: "0.875rem" }}
    >
      {section.code || ""}
    </SyntaxHighlighter>
  );
}
