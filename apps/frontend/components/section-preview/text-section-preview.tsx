"use client";

import type { TextSectionDTO } from "@/lib/api";
import { useSyntaxTheme } from "@/lib/syntax-highlighter-config";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

interface TextSectionPreviewProps {
    section: TextSectionDTO;
}

export function TextSectionPreview({ section }: TextSectionPreviewProps) {
    const syntaxTheme = useSyntaxTheme();

    if (section.format === "plain") {
        return <p className="whitespace-pre-wrap text-foreground leading-relaxed">{section.content || ""}</p>;
    }
    if (section.format === "html") {
        return <div dangerouslySetInnerHTML={{ __html: section.content }} />;
    }
    return (
        <div className="markdown">
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                    code({ className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || "");
                        const codeString = String(children).replace(/\n$/, "");
                        if (!match) {
                            return (
                                <code className={className} {...props}>
                                    {children}
                                </code>
                            );
                        }
                        return (
                            <SyntaxHighlighter
                                language={match[1]}
                                style={syntaxTheme}
                                PreTag="div"
                                customStyle={{ borderRadius: "0.5rem", fontSize: "0.875rem", margin: "0.75rem 0" }}
                            >
                                {codeString}
                            </SyntaxHighlighter>
                        );
                    },
                }}
            >
                {section.content || ""}
            </ReactMarkdown>
        </div>
    );
}
