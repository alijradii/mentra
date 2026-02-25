"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { Button } from "@/components/ui/button";
import { syntaxHighlighterTheme } from "@/lib/syntax-highlighter-config";
import type {
  SectionDTO,
  EmbeddingSectionDTO,
  QuizSectionDTO,
} from "@/lib/api";

function getEmbedUrl(section: EmbeddingSectionDTO): string {
  const url = section.url;
  if (section.embedType === "youtube") {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]+)/);
    if (match) return `https://www.youtube.com/embed/${match[1]}`;
  }
  if (section.embedType === "vimeo") {
    const match = url.match(/vimeo\.com\/(\d+)/);
    if (match) return `https://player.vimeo.com/video/${match[1]}`;
  }
  return url;
}

function QuizPreview({ section }: { section: QuizSectionDTO }) {
  const isMultiple = section.correctAnswers.length > 1;
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const toggle = (optId: string) => {
    if (submitted) return;
    if (isMultiple) {
      setSelected((prev) =>
        prev.includes(optId) ? prev.filter((id) => id !== optId) : [...prev, optId]
      );
    } else {
      setSelected([optId]);
    }
  };

  const isCorrect =
    submitted &&
    selected.length === section.correctAnswers.length &&
    selected.every((id) => section.correctAnswers.includes(id));

  return (
    <div className="space-y-3">
      <p className="font-semibold text-foreground text-base">{section.question}</p>
      <div className="space-y-2">
        {section.options.map((opt) => {
          const isSelected = selected.includes(opt.id);
          const isThisCorrect = section.correctAnswers.includes(opt.id);
          let cls = "border-border bg-card hover:bg-background";
          if (submitted) {
            if (isThisCorrect) cls = "border-success bg-success/15";
            else if (isSelected) cls = "border-destructive bg-destructive/15";
          } else if (isSelected) {
            cls = "border-primary bg-background";
          }
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggle(opt.id)}
              className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors text-sm ${cls} ${submitted ? "cursor-default" : "cursor-pointer"}`}
            >
              {opt.text}
            </button>
          );
        })}
      </div>
      {!submitted ? (
        <Button size="sm" onClick={() => setSubmitted(true)} disabled={selected.length === 0}>
          Check answer
        </Button>
      ) : (
        <div
          className={`p-3 rounded-lg text-sm ${
            isCorrect
              ? "bg-success/15 text-success border border-success/40"
              : "bg-destructive/15 text-destructive border border-destructive/40"
          }`}
        >
          <p className="font-semibold">{isCorrect ? "Correct!" : "Not quite."}</p>
          {section.explanation && <p className="mt-1">{section.explanation}</p>}
        </div>
      )}
    </div>
  );
}

export function SectionPreview({ section }: { section: SectionDTO }) {
  if (section.type === "text") {
    if (section.format === "plain") {
      return (
        <p className="whitespace-pre-wrap text-foreground leading-relaxed">{section.content || ""}</p>
      );
    }
    if (section.format === "html") {
      return <div dangerouslySetInnerHTML={{ __html: section.content }} />;
    }
    return (
      <div className="markdown">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
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
                  style={syntaxHighlighterTheme}
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

  if (section.type === "image") {
    if (!section.url)
      return <p className="text-muted-foreground/80 text-sm italic">No image URL provided.</p>;
    return (
      <figure>
        <img src={section.url} alt={section.alt || ""} className="max-w-full rounded-lg" />
        {section.caption && (
          <figcaption className="text-sm text-muted-foreground mt-2 text-center">
            {section.caption}
          </figcaption>
        )}
      </figure>
    );
  }

  if (section.type === "video") {
    if (!section.url)
      return <p className="text-muted-foreground/80 text-sm italic">No video URL provided.</p>;
    return (
      <figure>
        <video controls src={section.url} className="w-full rounded-lg" />
        {section.caption && (
          <figcaption className="text-sm text-muted-foreground mt-2">{section.caption}</figcaption>
        )}
      </figure>
    );
  }

  if (section.type === "embedding") {
    if (!section.url)
      return <p className="text-muted-foreground/80 text-sm italic">No embed URL provided.</p>;
    return (
      <div>
        {section.title && (
          <p className="text-sm font-medium text-foreground mb-2">{section.title}</p>
        )}
        <iframe
          src={getEmbedUrl(section)}
          className="w-full rounded-lg"
          style={{ aspectRatio: "16/9", border: "none" }}
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          title={section.title || "Embedded content"}
        />
      </div>
    );
  }

  if (section.type === "code") {
    return (
      <SyntaxHighlighter
        language={section.language || "text"}
        style={syntaxHighlighterTheme}
        showLineNumbers
        customStyle={{ borderRadius: "0.5rem", fontSize: "0.875rem" }}
      >
        {section.code || ""}
      </SyntaxHighlighter>
    );
  }

  if (section.type === "quiz") {
    return <QuizPreview section={section} />;
  }

  return null;
}
