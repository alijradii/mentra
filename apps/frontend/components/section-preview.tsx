"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import katex from "katex";
import "katex/dist/katex.min.css";
import { Button } from "@/components/ui/button";
import { useSyntaxTheme } from "@/lib/syntax-highlighter-config";
import type {
  SectionDTO,
  EmbeddingSectionDTO,
  QuizSectionDTO,
  MCQQuizSectionDTO,
  TrueFalseQuizSectionDTO,
  ShortAnswerQuizSectionDTO,
  SequenceQuizSectionDTO,
  MatchingQuizSectionDTO,
  FillBlankQuizSectionDTO,
  MathInputQuizSectionDTO,
  ClassificationQuizSectionDTO,
  QuizType,
} from "@/lib/api";

// ---------- Helpers ----------

function ResultBanner({ correct, explanation }: { correct: boolean; explanation?: string }) {
  return (
    <div
      className={`p-3 rounded-lg text-sm ${
        correct
          ? "bg-success/15 text-success border border-success/40"
          : "bg-destructive/15 text-destructive border border-destructive/40"
      }`}
    >
      <p className="font-semibold">{correct ? "Correct!" : "Not quite."}</p>
      {explanation && <p className="mt-1">{explanation}</p>}
    </div>
  );
}

function KaTeXRender({ latex }: { latex: string }) {
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

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- MCQ ----------

function MCQPreview({ section }: { section: MCQQuizSectionDTO }) {
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
    <>
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
        <ResultBanner correct={isCorrect} explanation={section.explanation} />
      )}
    </>
  );
}

// ---------- True / False ----------

function TrueFalsePreview({ section }: { section: TrueFalseQuizSectionDTO }) {
  const [selected, setSelected] = useState<boolean | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const isCorrect = submitted && selected === section.correctAnswer;

  return (
    <>
      <div className="flex gap-3">
        {[true, false].map((val) => {
          let cls = "border-border bg-card hover:bg-background";
          if (submitted) {
            if (val === section.correctAnswer) cls = "border-success bg-success/15";
            else if (val === selected) cls = "border-destructive bg-destructive/15";
          } else if (val === selected) {
            cls = "border-primary bg-background";
          }
          return (
            <button
              key={String(val)}
              type="button"
              onClick={() => !submitted && setSelected(val)}
              className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors text-sm font-medium ${cls} ${submitted ? "cursor-default" : "cursor-pointer"}`}
            >
              {val ? "True" : "False"}
            </button>
          );
        })}
      </div>
      {!submitted ? (
        <Button size="sm" onClick={() => setSubmitted(true)} disabled={selected === null}>
          Check answer
        </Button>
      ) : (
        <ResultBanner correct={isCorrect} explanation={section.explanation} />
      )}
    </>
  );
}

// ---------- Short Answer ----------

function ShortAnswerPreview({ section }: { section: ShortAnswerQuizSectionDTO }) {
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const normalize = (s: string) => {
    let v = s;
    if (section.trimWhitespace !== false) v = v.trim();
    if (!section.caseSensitive) v = v.toLowerCase();
    return v;
  };
  const isCorrect = submitted && section.acceptedAnswers.some((a) => normalize(a) === normalize(answer));

  return (
    <>
      <input
        type="text"
        value={answer}
        onChange={(e) => !submitted && setAnswer(e.target.value)}
        placeholder="Type your answer\u2026"
        className="w-full px-4 py-3 rounded-lg border-2 border-border bg-card text-sm focus:outline-none focus:border-primary transition-colors"
        readOnly={submitted}
      />
      {!submitted ? (
        <Button size="sm" onClick={() => setSubmitted(true)} disabled={!answer.trim()}>
          Check answer
        </Button>
      ) : (
        <>
          <ResultBanner correct={isCorrect} explanation={section.explanation} />
          {!isCorrect && (
            <p className="text-xs text-muted-foreground">
              Accepted: {section.acceptedAnswers.join(", ")}
            </p>
          )}
        </>
      )}
    </>
  );
}

// ---------- Sequence (sortable) ----------

function SortableItem({ id, text, locked }: { id: string; text: string; locked: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id, disabled: locked });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`px-4 py-3 rounded-lg border-2 text-sm select-none ${
        locked
          ? "border-muted bg-muted/30 text-muted-foreground cursor-default"
          : "border-border bg-card cursor-grab active:cursor-grabbing hover:bg-background"
      }`}
    >
      {locked && <span className="text-xs text-muted-foreground mr-2">(fixed)</span>}
      {text}
    </div>
  );
}

function SequencePreview({ section }: { section: SequenceQuizSectionDTO }) {
  const prefilledSet = useMemo(
    () => new Set((section.prefilledPositions ?? []).map((p) => p.itemId)),
    [section.prefilledPositions]
  );

  const initialOrder = useMemo(() => {
    const locked = new Map((section.prefilledPositions ?? []).map((p) => [p.position, p.itemId]));
    const unlocked = shuffle(section.items.filter((it) => !prefilledSet.has(it.id)).map((it) => it.id));
    const result: string[] = [];
    let ui = 0;
    for (let pos = 0; pos < section.items.length; pos++) {
      if (locked.has(pos)) {
        result.push(locked.get(pos)!);
      } else {
        result.push(unlocked[ui++]);
      }
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [order, setOrder] = useState<string[]>(initialOrder);
  const [submitted, setSubmitted] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    if (submitted) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    if (prefilledSet.has(String(active.id)) || prefilledSet.has(String(over.id))) return;
    setOrder((prev) => {
      const oldIdx = prev.indexOf(String(active.id));
      const newIdx = prev.indexOf(String(over.id));
      return arrayMove(prev, oldIdx, newIdx);
    });
  };

  const isCorrect = submitted && order.every((id, i) => section.correctOrder[i] === id);
  const itemMap = useMemo(() => new Map(section.items.map((it) => [it.id, it.text])), [section.items]);

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {order.map((id) => (
              <SortableItem key={id} id={id} text={itemMap.get(id) ?? ""} locked={prefilledSet.has(id)} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {!submitted ? (
        <Button size="sm" onClick={() => setSubmitted(true)}>
          Check answer
        </Button>
      ) : (
        <ResultBanner correct={isCorrect} explanation={section.explanation} />
      )}
    </>
  );
}

// ---------- Matching ----------

function MatchingPreview({ section }: { section: MatchingQuizSectionDTO }) {
  const shuffledRight = useMemo(() => shuffle(section.pairs.map((p) => ({ id: p.id, text: p.right }))), [section.pairs]);
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const isCorrect =
    submitted &&
    section.pairs.every((p) => matches[p.id] === p.id);

  const allFilled = section.pairs.every((p) => matches[p.id]);

  return (
    <>
      <div className="space-y-2">
        {section.pairs.map((pair) => {
          const chosen = matches[pair.id];
          let borderCls = "border-border";
          if (submitted) {
            borderCls = chosen === pair.id ? "border-success" : "border-destructive";
          }
          return (
            <div key={pair.id} className="flex items-center gap-3">
              <span className="flex-1 px-3 py-2 rounded-lg border bg-card text-sm">{pair.left}</span>
              <span className="text-muted-foreground text-sm">&rarr;</span>
              <select
                value={chosen ?? ""}
                onChange={(e) => !submitted && setMatches((prev) => ({ ...prev, [pair.id]: e.target.value }))}
                disabled={submitted}
                className={`flex-1 px-3 py-2 rounded-lg border-2 bg-card text-sm focus:outline-none ${borderCls} ${submitted ? "cursor-default" : ""}`}
              >
                <option value="">Select match</option>
                {shuffledRight.map((r) => (
                  <option key={r.id} value={r.id}>{r.text}</option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
      {!submitted ? (
        <Button size="sm" onClick={() => setSubmitted(true)} disabled={!allFilled}>
          Check answer
        </Button>
      ) : (
        <ResultBanner correct={isCorrect} explanation={section.explanation} />
      )}
    </>
  );
}

// ---------- Fill in the Blank ----------

function FillBlankPreview({ section }: { section: FillBlankQuizSectionDTO }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const blanksMap = useMemo(() => new Map(section.blanks.map((b) => [b.id, b])), [section.blanks]);
  const hasWordBank = section.wordBank && section.wordBank.length > 0;

  const parts = useMemo(() => {
    const regex = /\{\{blank:([^}]+)\}\}/g;
    const result: { type: "text" | "blank"; value: string }[] = [];
    let last = 0;
    let match;
    while ((match = regex.exec(section.template)) !== null) {
      if (match.index > last) result.push({ type: "text", value: section.template.slice(last, match.index) });
      result.push({ type: "blank", value: match[1] });
      last = match.index + match[0].length;
    }
    if (last < section.template.length) result.push({ type: "text", value: section.template.slice(last) });
    return result;
  }, [section.template]);

  const checkBlank = (blankId: string, value: string) => {
    const blank = blanksMap.get(blankId);
    if (!blank) return false;
    return blank.acceptedAnswers.some((a) => a.trim().toLowerCase() === value.trim().toLowerCase());
  };

  const allFilled = section.blanks.every((b) => answers[b.id]?.trim());
  const isCorrect = submitted && section.blanks.every((b) => checkBlank(b.id, answers[b.id] ?? ""));

  return (
    <>
      <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap p-4 bg-card border rounded-lg">
        {parts.map((part, i) => {
          if (part.type === "text") return <span key={i}>{part.value}</span>;
          const val = answers[part.value] ?? "";
          let borderCls = "border-primary/50";
          if (submitted) borderCls = checkBlank(part.value, val) ? "border-success" : "border-destructive";

          if (hasWordBank) {
            return (
              <select
                key={i}
                value={val}
                onChange={(e) => !submitted && setAnswers((prev) => ({ ...prev, [part.value]: e.target.value }))}
                disabled={submitted}
                className={`inline-block mx-1 px-2 py-0.5 rounded border-2 bg-background text-sm ${borderCls} ${submitted ? "cursor-default" : ""}`}
              >
                <option value="">___</option>
                {section.wordBank!.map((w, wi) => (
                  <option key={wi} value={w}>{w}</option>
                ))}
              </select>
            );
          }

          return (
            <input
              key={i}
              type="text"
              value={val}
              onChange={(e) => !submitted && setAnswers((prev) => ({ ...prev, [part.value]: e.target.value }))}
              readOnly={submitted}
              placeholder="___"
              className={`inline-block mx-1 px-2 py-0.5 rounded border-2 bg-background text-sm w-28 ${borderCls} focus:outline-none`}
            />
          );
        })}
      </div>
      {hasWordBank && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground mr-1">Word bank:</span>
          {section.wordBank!.map((w, i) => (
            <span key={i} className="px-2 py-1 rounded bg-muted text-xs">{w}</span>
          ))}
        </div>
      )}
      {!submitted ? (
        <Button size="sm" onClick={() => setSubmitted(true)} disabled={!allFilled}>
          Check answer
        </Button>
      ) : (
        <ResultBanner correct={isCorrect} explanation={section.explanation} />
      )}
    </>
  );
}

// ---------- Math Input ----------

function MathInputPreview({ section }: { section: MathInputQuizSectionDTO }) {
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const isCorrect = submitted && section.acceptedAnswers.some((a) => a.trim() === answer.trim());

  return (
    <>
      <div className="space-y-2">
        <input
          type="text"
          value={answer}
          onChange={(e) => !submitted && setAnswer(e.target.value)}
          placeholder={section.inputFormat === "latex" ? "Enter LaTeX, e.g. \\frac{1}{2}" : "Enter expression\u2026"}
          className="w-full px-4 py-3 rounded-lg border-2 border-border bg-card text-sm font-mono focus:outline-none focus:border-primary transition-colors"
          readOnly={submitted}
        />
        {answer && (
          <div className="p-3 bg-background border rounded-lg text-center">
            <span className="text-xs text-muted-foreground block mb-1">Preview:</span>
            <KaTeXRender latex={answer} />
          </div>
        )}
      </div>
      {!submitted ? (
        <Button size="sm" onClick={() => setSubmitted(true)} disabled={!answer.trim()}>
          Check answer
        </Button>
      ) : (
        <>
          <ResultBanner correct={isCorrect} explanation={section.explanation} />
          {!isCorrect && (
            <div className="text-xs text-muted-foreground">
              Expected: {section.acceptedAnswers.map((a, i) => (
                <span key={i} className="inline-block mx-1"><KaTeXRender latex={a} /></span>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}

// ---------- Classification ----------

function ClassificationPreview({ section }: { section: ClassificationQuizSectionDTO }) {
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const allFilled = section.items.every((it) => assignments[it.id]);
  const isCorrect = submitted && section.items.every((it) => assignments[it.id] === it.categoryId);

  return (
    <>
      <div className="space-y-2">
        {section.items.map((item) => {
          const chosen = assignments[item.id] ?? "";
          let borderCls = "border-border";
          if (submitted) {
            borderCls = chosen === item.categoryId ? "border-success" : "border-destructive";
          }
          return (
            <div key={item.id} className="flex items-center gap-3">
              <span className="flex-1 px-3 py-2 rounded-lg border bg-card text-sm">{item.text}</span>
              <span className="text-muted-foreground text-sm">&rarr;</span>
              <select
                value={chosen}
                onChange={(e) => !submitted && setAssignments((prev) => ({ ...prev, [item.id]: e.target.value }))}
                disabled={submitted}
                className={`flex-1 px-3 py-2 rounded-lg border-2 bg-card text-sm focus:outline-none ${borderCls} ${submitted ? "cursor-default" : ""}`}
              >
                <option value="">Select category</option>
                {section.categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
      {!submitted ? (
        <Button size="sm" onClick={() => setSubmitted(true)} disabled={!allFilled}>
          Check answer
        </Button>
      ) : (
        <ResultBanner correct={isCorrect} explanation={section.explanation} />
      )}
    </>
  );
}

// ---------- Quiz Dispatcher ----------

function QuizPreview({ section }: { section: QuizSectionDTO }) {
  const quizType: QuizType = ("quizType" in section ? section.quizType : "mcq") as QuizType;

  const inner = (() => {
    switch (quizType) {
      case "mcq":
        return <MCQPreview section={section as MCQQuizSectionDTO} />;
      case "true-false":
        return <TrueFalsePreview section={section as TrueFalseQuizSectionDTO} />;
      case "short-answer":
        return <ShortAnswerPreview section={section as ShortAnswerQuizSectionDTO} />;
      case "sequence":
        return <SequencePreview section={section as SequenceQuizSectionDTO} />;
      case "matching":
        return <MatchingPreview section={section as MatchingQuizSectionDTO} />;
      case "fill-blank":
        return <FillBlankPreview section={section as FillBlankQuizSectionDTO} />;
      case "math-input":
        return <MathInputPreview section={section as MathInputQuizSectionDTO} />;
      case "classification":
        return <ClassificationPreview section={section as ClassificationQuizSectionDTO} />;
      default:
        return <p className="text-muted-foreground text-sm italic">Unknown quiz type.</p>;
    }
  })();

  return (
    <div className="space-y-3">
      <p className="font-semibold text-foreground text-base">{section.question}</p>
      {inner}
    </div>
  );
}

// ---------- Embed URL helper ----------

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

// ---------- Main export ----------

export function SectionPreview({ section }: { section: SectionDTO }) {
  const syntaxTheme = useSyntaxTheme();

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
        style={syntaxTheme}
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
