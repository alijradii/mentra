"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  SectionDTO,
  SectionType,
  QuizType,
  QuizSectionDTO,
  MCQQuizSectionDTO,
  SequenceQuizSectionDTO,
  ShortAnswerQuizSectionDTO,
  MatchingQuizSectionDTO,
  FillBlankQuizSectionDTO,
  MathInputQuizSectionDTO,
  ClassificationQuizSectionDTO,
  TrueFalseQuizSectionDTO,
} from "@/lib/api";

export function genId(): string {
  return crypto.randomUUID();
}

const QUIZ_TYPE_LABELS: { type: QuizType; label: string }[] = [
  { type: "mcq", label: "Multiple Choice" },
  { type: "true-false", label: "True / False" },
  { type: "short-answer", label: "Short Answer" },
  { type: "sequence", label: "Sequence" },
  { type: "matching", label: "Matching" },
  { type: "fill-blank", label: "Fill in the Blank" },
  { type: "math-input", label: "Math Input" },
  { type: "classification", label: "Classification" },
];

function createEmptyQuizData(quizType: QuizType, base: { id: string; order: number; createdAt: string; updatedAt: string }): QuizSectionDTO {
  const shared = {
    ...base,
    type: "quiz" as const,
    question: "",
    explanation: "",
    points: 10,
  };
  switch (quizType) {
    case "mcq":
      return {
        ...shared,
        quizType: "mcq",
        options: [
          { id: genId(), text: "", order: 0 },
          { id: genId(), text: "", order: 1 },
        ],
        correctAnswers: [],
      };
    case "true-false":
      return { ...shared, quizType: "true-false", correctAnswer: true };
    case "short-answer":
      return {
        ...shared,
        quizType: "short-answer",
        acceptedAnswers: [""],
        caseSensitive: false,
        trimWhitespace: true,
      };
    case "sequence":
      return {
        ...shared,
        quizType: "sequence",
        items: [
          { id: genId(), text: "" },
          { id: genId(), text: "" },
        ],
        correctOrder: [],
      };
    case "matching":
      return {
        ...shared,
        quizType: "matching",
        pairs: [
          { id: genId(), left: "", right: "" },
          { id: genId(), left: "", right: "" },
        ],
      };
    case "fill-blank":
      return {
        ...shared,
        quizType: "fill-blank",
        template: "",
        blanks: [],
        wordBank: [],
      };
    case "math-input":
      return {
        ...shared,
        quizType: "math-input",
        acceptedAnswers: [""],
        inputFormat: "latex",
        comparisonMode: "exact",
      };
    case "classification":
      return {
        ...shared,
        quizType: "classification",
        categories: [
          { id: genId(), label: "" },
          { id: genId(), label: "" },
        ],
        items: [
          { id: genId(), text: "", categoryId: "" },
        ],
      };
  }
}

export function createEmptySection(type: SectionType, order: number): SectionDTO {
  const base = {
    id: genId(),
    order,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  switch (type) {
    case "text":
      return { ...base, type, content: "", format: "markdown" };
    case "image":
      return { ...base, type, url: "", alt: "", caption: "" };
    case "video":
      return { ...base, type, url: "", caption: "" };
    case "embedding":
      return { ...base, type, url: "", embedType: "youtube", title: "" };
    case "code":
      return { ...base, type, code: "", language: "javascript" };
    case "quiz":
      return createEmptyQuizData("mcq", base);
  }
}

export function sectionSummary(s: SectionDTO): string {
  switch (s.type) {
    case "text":
      return s.content ? s.content.slice(0, 80) + (s.content.length > 80 ? "\u2026" : "") : "(empty)";
    case "image":
      return s.url || "(no URL)";
    case "video":
      return s.url || "(no URL)";
    case "embedding":
      return s.url || "(no URL)";
    case "code":
      return s.language || "(no language)";
    case "quiz": {
      const qt = ("quizType" in s ? s.quizType : "mcq") as QuizType;
      const label = QUIZ_TYPE_LABELS.find((l) => l.type === qt)?.label ?? qt;
      return s.question ? `[${label}] ${s.question}` : `[${label}] (no question)`;
    }
  }
}

export const SECTION_TYPES: { type: SectionType; label: string }[] = [
  { type: "text", label: "Text" },
  { type: "image", label: "Image" },
  { type: "video", label: "Video" },
  { type: "embedding", label: "Embed" },
  { type: "code", label: "Code" },
  { type: "quiz", label: "Quiz" },
];

export const SELECT_CLASS =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

interface SectionFormProps {
  section: SectionDTO;
  onChange: (updated: SectionDTO) => void;
}

// ---------- Per-variant quiz editors ----------

function MCQEditor({ section, onChange }: { section: MCQQuizSectionDTO; onChange: (s: QuizSectionDTO) => void }) {
  const toggleCorrect = (optId: string) => {
    const next = section.correctAnswers.includes(optId)
      ? section.correctAnswers.filter((id) => id !== optId)
      : [...section.correctAnswers, optId];
    onChange({ ...section, correctAnswers: next });
  };
  const updateOption = (optId: string, text: string) => {
    onChange({
      ...section,
      options: section.options.map((o) => (o.id === optId ? { ...o, text } : o)),
    });
  };
  const addOption = () => {
    onChange({
      ...section,
      options: [...section.options, { id: genId(), text: "", order: section.options.length }],
    });
  };
  const removeOption = (optId: string) => {
    onChange({
      ...section,
      options: section.options.filter((o) => o.id !== optId),
      correctAnswers: section.correctAnswers.filter((id) => id !== optId),
    });
  };

  return (
    <>
      <div>
        <Label>
          Options <span className="text-muted-foreground/80 font-normal">(check correct answers)</span>
        </Label>
        <div className="mt-1 space-y-2">
          {section.options.map((opt, i) => (
            <div key={opt.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={section.correctAnswers.includes(opt.id)}
                onChange={() => toggleCorrect(opt.id)}
                className="h-4 w-4 rounded border-border"
              />
              <Input
                value={opt.text}
                onChange={(e) => updateOption(opt.id, e.target.value)}
                placeholder={`Option ${i + 1}`}
                className="flex-1"
              />
              {section.options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(opt.id)}
                  className="text-destructive hover:text-destructive text-sm px-1"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addOption}>
            + Add option
          </Button>
        </div>
      </div>
    </>
  );
}

function TrueFalseEditor({ section, onChange }: { section: TrueFalseQuizSectionDTO; onChange: (s: QuizSectionDTO) => void }) {
  return (
    <div>
      <Label>Correct answer</Label>
      <div className="mt-1 flex gap-3">
        {[true, false].map((val) => (
          <button
            key={String(val)}
            type="button"
            onClick={() => onChange({ ...section, correctAnswer: val })}
            className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
              section.correctAnswer === val
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card hover:bg-background"
            }`}
          >
            {val ? "True" : "False"}
          </button>
        ))}
      </div>
    </div>
  );
}

function ShortAnswerEditor({ section, onChange }: { section: ShortAnswerQuizSectionDTO; onChange: (s: QuizSectionDTO) => void }) {
  const updateAnswer = (idx: number, text: string) => {
    const next = [...section.acceptedAnswers];
    next[idx] = text;
    onChange({ ...section, acceptedAnswers: next });
  };
  const addAnswer = () => onChange({ ...section, acceptedAnswers: [...section.acceptedAnswers, ""] });
  const removeAnswer = (idx: number) => onChange({ ...section, acceptedAnswers: section.acceptedAnswers.filter((_, i) => i !== idx) });

  return (
    <>
      <div>
        <Label>Accepted answers</Label>
        <div className="mt-1 space-y-2">
          {section.acceptedAnswers.map((ans, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={ans}
                onChange={(e) => updateAnswer(i, e.target.value)}
                placeholder={`Answer ${i + 1}`}
                className="flex-1"
              />
              {section.acceptedAnswers.length > 1 && (
                <button type="button" onClick={() => removeAnswer(i)} className="text-destructive text-sm px-1">✕</button>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addAnswer}>+ Add answer</Button>
        </div>
      </div>
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={section.caseSensitive ?? false}
            onChange={(e) => onChange({ ...section, caseSensitive: e.target.checked })}
            className="h-4 w-4 rounded border-border"
          />
          Case sensitive
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={section.trimWhitespace ?? true}
            onChange={(e) => onChange({ ...section, trimWhitespace: e.target.checked })}
            className="h-4 w-4 rounded border-border"
          />
          Trim whitespace
        </label>
      </div>
    </>
  );
}

function SequenceEditor({ section, onChange }: { section: SequenceQuizSectionDTO; onChange: (s: QuizSectionDTO) => void }) {
  const updateItem = (id: string, text: string) => {
    onChange({ ...section, items: section.items.map((it) => (it.id === id ? { ...it, text } : it)) });
  };
  const addItem = () => {
    const item = { id: genId(), text: "" };
    onChange({ ...section, items: [...section.items, item] });
  };
  const removeItem = (id: string) => {
    onChange({
      ...section,
      items: section.items.filter((it) => it.id !== id),
      correctOrder: section.correctOrder.filter((oid) => oid !== id),
      prefilledPositions: section.prefilledPositions?.filter((p) => p.itemId !== id),
    });
  };
  const setCorrectOrder = () => {
    onChange({ ...section, correctOrder: section.items.map((it) => it.id) });
  };

  return (
    <>
      <div>
        <Label>Items <span className="text-muted-foreground/80 font-normal">(in the order they appear to the author)</span></Label>
        <div className="mt-1 space-y-2">
          {section.items.map((item, i) => (
            <div key={item.id} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-6 text-right">{i + 1}.</span>
              <Input
                value={item.text}
                onChange={(e) => updateItem(item.id, e.target.value)}
                placeholder={`Item ${i + 1}`}
                className="flex-1"
              />
              {section.items.length > 2 && (
                <button type="button" onClick={() => removeItem(item.id)} className="text-destructive text-sm px-1">✕</button>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addItem}>+ Add item</Button>
        </div>
      </div>
      <div>
        <Label>Correct order <span className="text-muted-foreground/80 font-normal">(comma-separated item numbers, or use button)</span></Label>
        <div className="mt-1 flex items-center gap-2">
          <Input
            value={section.correctOrder.map((id) => {
              const idx = section.items.findIndex((it) => it.id === id);
              return idx >= 0 ? idx + 1 : "?";
            }).join(", ")}
            readOnly
            className="flex-1 bg-muted/50"
          />
          <Button type="button" variant="outline" size="sm" onClick={setCorrectOrder}>
            Use current order
          </Button>
        </div>
      </div>
      <div>
        <Label>Prefilled positions <span className="text-muted-foreground/80 font-normal">(optional, positions that are already filled for the student)</span></Label>
        <div className="mt-1 space-y-2">
          {(section.prefilledPositions ?? []).map((pf, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Pos</span>
              <Input
                type="number"
                min={0}
                value={pf.position}
                onChange={(e) => {
                  const next = [...(section.prefilledPositions ?? [])];
                  next[i] = { ...pf, position: parseInt(e.target.value) || 0 };
                  onChange({ ...section, prefilledPositions: next });
                }}
                className="w-20"
              />
              <span className="text-xs text-muted-foreground">Item #</span>
              <select
                value={pf.itemId}
                onChange={(e) => {
                  const next = [...(section.prefilledPositions ?? [])];
                  next[i] = { ...pf, itemId: e.target.value };
                  onChange({ ...section, prefilledPositions: next });
                }}
                className={`w-48 ${SELECT_CLASS}`}
              >
                <option value="">Select item</option>
                {section.items.map((it, idx) => (
                  <option key={it.id} value={it.id}>{idx + 1}. {it.text || "(empty)"}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => onChange({ ...section, prefilledPositions: (section.prefilledPositions ?? []).filter((_, j) => j !== i) })}
                className="text-destructive text-sm px-1"
              >✕</button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange({ ...section, prefilledPositions: [...(section.prefilledPositions ?? []), { position: 0, itemId: "" }] })}
          >
            + Add prefilled position
          </Button>
        </div>
      </div>
    </>
  );
}

function MatchingEditor({ section, onChange }: { section: MatchingQuizSectionDTO; onChange: (s: QuizSectionDTO) => void }) {
  const updatePair = (id: string, field: "left" | "right", value: string) => {
    onChange({ ...section, pairs: section.pairs.map((p) => (p.id === id ? { ...p, [field]: value } : p)) });
  };
  const addPair = () => {
    onChange({ ...section, pairs: [...section.pairs, { id: genId(), left: "", right: "" }] });
  };
  const removePair = (id: string) => {
    onChange({ ...section, pairs: section.pairs.filter((p) => p.id !== id) });
  };

  return (
    <div>
      <Label>Pairs <span className="text-muted-foreground/80 font-normal">(left matches right)</span></Label>
      <div className="mt-1 space-y-2">
        {section.pairs.map((pair, i) => (
          <div key={pair.id} className="flex items-center gap-2">
            <Input
              value={pair.left}
              onChange={(e) => updatePair(pair.id, "left", e.target.value)}
              placeholder={`Left ${i + 1}`}
              className="flex-1"
            />
            <span className="text-muted-foreground text-sm">&harr;</span>
            <Input
              value={pair.right}
              onChange={(e) => updatePair(pair.id, "right", e.target.value)}
              placeholder={`Right ${i + 1}`}
              className="flex-1"
            />
            {section.pairs.length > 2 && (
              <button type="button" onClick={() => removePair(pair.id)} className="text-destructive text-sm px-1">✕</button>
            )}
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addPair}>+ Add pair</Button>
      </div>
    </div>
  );
}

function FillBlankEditor({ section, onChange }: { section: FillBlankQuizSectionDTO; onChange: (s: QuizSectionDTO) => void }) {
  const syncBlanks = (template: string) => {
    const regex = /\{\{blank:([^}]+)\}\}/g;
    const ids: string[] = [];
    let match;
    while ((match = regex.exec(template)) !== null) ids.push(match[1]);
    const existingMap = new Map(section.blanks.map((b) => [b.id, b]));
    const blanks = ids.map((id) => existingMap.get(id) ?? { id, acceptedAnswers: [""] });
    onChange({ ...section, template, blanks });
  };

  const updateBlankAnswer = (blankId: string, idx: number, value: string) => {
    onChange({
      ...section,
      blanks: section.blanks.map((b) =>
        b.id === blankId ? { ...b, acceptedAnswers: b.acceptedAnswers.map((a, i) => (i === idx ? value : a)) } : b
      ),
    });
  };
  const addBlankAnswer = (blankId: string) => {
    onChange({
      ...section,
      blanks: section.blanks.map((b) =>
        b.id === blankId ? { ...b, acceptedAnswers: [...b.acceptedAnswers, ""] } : b
      ),
    });
  };
  const removeBlankAnswer = (blankId: string, idx: number) => {
    onChange({
      ...section,
      blanks: section.blanks.map((b) =>
        b.id === blankId ? { ...b, acceptedAnswers: b.acceptedAnswers.filter((_, i) => i !== idx) } : b
      ),
    });
  };

  const updateWordBank = (idx: number, value: string) => {
    const wb = [...(section.wordBank ?? [])];
    wb[idx] = value;
    onChange({ ...section, wordBank: wb });
  };
  const addWord = () => onChange({ ...section, wordBank: [...(section.wordBank ?? []), ""] });
  const removeWord = (idx: number) => onChange({ ...section, wordBank: (section.wordBank ?? []).filter((_, i) => i !== idx) });

  return (
    <>
      <div>
        <Label>Template <span className="text-muted-foreground/80 font-normal">(use {"{{blank:id}}"} for blanks, e.g. {"{{blank:city}}"})</span></Label>
        <Textarea
          value={section.template}
          onChange={(e) => syncBlanks(e.target.value)}
          rows={4}
          placeholder={'const {{blank:var}} = "Berlin";\nprint({{blank:var}}, " is the capital of ", {{blank:country}})'}
          className="mt-1 font-mono text-xs"
        />
      </div>
      <div>
        <Label>Language <span className="text-muted-foreground/80 font-normal">(optional, for syntax highlighting)</span></Label>
        <Input
          value={section.language ?? ""}
          onChange={(e) => onChange({ ...section, language: e.target.value || undefined })}
          placeholder="e.g. javascript, python"
          className="mt-1"
        />
      </div>
      {section.blanks.length > 0 && (
        <div>
          <Label>Blank accepted answers</Label>
          <div className="mt-1 space-y-3">
            {section.blanks.map((blank) => (
              <div key={blank.id} className="p-3 border rounded-lg bg-background space-y-2">
                <p className="text-xs font-mono text-muted-foreground">{`{{blank:${blank.id}}}`}</p>
                {blank.acceptedAnswers.map((ans, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={ans}
                      onChange={(e) => updateBlankAnswer(blank.id, i, e.target.value)}
                      placeholder={`Answer ${i + 1}`}
                      className="flex-1"
                    />
                    {blank.acceptedAnswers.length > 1 && (
                      <button type="button" onClick={() => removeBlankAnswer(blank.id, i)} className="text-destructive text-sm px-1">✕</button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => addBlankAnswer(blank.id)}>+ Add answer</Button>
              </div>
            ))}
          </div>
        </div>
      )}
      <div>
        <Label>Word bank <span className="text-muted-foreground/80 font-normal">(optional, draggable options for students)</span></Label>
        <div className="mt-1 space-y-2">
          {(section.wordBank ?? []).map((word, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={word}
                onChange={(e) => updateWordBank(i, e.target.value)}
                placeholder={`Word ${i + 1}`}
                className="flex-1"
              />
              <button type="button" onClick={() => removeWord(i)} className="text-destructive text-sm px-1">✕</button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addWord}>+ Add word</Button>
        </div>
      </div>
    </>
  );
}

function MathInputEditor({ section, onChange }: { section: MathInputQuizSectionDTO; onChange: (s: QuizSectionDTO) => void }) {
  const updateAnswer = (idx: number, value: string) => {
    const next = [...section.acceptedAnswers];
    next[idx] = value;
    onChange({ ...section, acceptedAnswers: next });
  };
  const addAnswer = () => onChange({ ...section, acceptedAnswers: [...section.acceptedAnswers, ""] });
  const removeAnswer = (idx: number) => onChange({ ...section, acceptedAnswers: section.acceptedAnswers.filter((_, i) => i !== idx) });

  return (
    <>
      <div>
        <Label>Input format</Label>
        <select
          value={section.inputFormat}
          onChange={(e) => onChange({ ...section, inputFormat: e.target.value as "latex" | "asciimath" })}
          className={`mt-1 ${SELECT_CLASS}`}
        >
          <option value="latex">LaTeX</option>
          <option value="asciimath">AsciiMath</option>
        </select>
      </div>
      <div>
        <Label>Accepted answers <span className="text-muted-foreground/80 font-normal">(LaTeX notation)</span></Label>
        <div className="mt-1 space-y-2">
          {section.acceptedAnswers.map((ans, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={ans}
                onChange={(e) => updateAnswer(i, e.target.value)}
                placeholder={`e.g. \\frac{1}{2}`}
                className="flex-1 font-mono text-xs"
              />
              {section.acceptedAnswers.length > 1 && (
                <button type="button" onClick={() => removeAnswer(i)} className="text-destructive text-sm px-1">✕</button>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addAnswer}>+ Add answer</Button>
        </div>
      </div>
      <div>
        <Label>Comparison mode</Label>
        <select
          value={section.comparisonMode ?? "exact"}
          onChange={(e) => onChange({ ...section, comparisonMode: e.target.value as "exact" | "symbolic" })}
          className={`mt-1 ${SELECT_CLASS}`}
        >
          <option value="exact">Exact match</option>
          <option value="symbolic">Symbolic (future)</option>
        </select>
      </div>
    </>
  );
}

function ClassificationEditor({ section, onChange }: { section: ClassificationQuizSectionDTO; onChange: (s: QuizSectionDTO) => void }) {
  const updateCategory = (id: string, label: string) => {
    onChange({ ...section, categories: section.categories.map((c) => (c.id === id ? { ...c, label } : c)) });
  };
  const addCategory = () => {
    onChange({ ...section, categories: [...section.categories, { id: genId(), label: "" }] });
  };
  const removeCategory = (id: string) => {
    onChange({
      ...section,
      categories: section.categories.filter((c) => c.id !== id),
      items: section.items.map((it) => (it.categoryId === id ? { ...it, categoryId: "" } : it)),
    });
  };

  const updateItem = (id: string, field: "text" | "categoryId", value: string) => {
    onChange({ ...section, items: section.items.map((it) => (it.id === id ? { ...it, [field]: value } : it)) });
  };
  const addItem = () => {
    onChange({ ...section, items: [...section.items, { id: genId(), text: "", categoryId: "" }] });
  };
  const removeItem = (id: string) => {
    onChange({ ...section, items: section.items.filter((it) => it.id !== id) });
  };

  return (
    <>
      <div>
        <Label>Categories</Label>
        <div className="mt-1 space-y-2">
          {section.categories.map((cat, i) => (
            <div key={cat.id} className="flex items-center gap-2">
              <Input
                value={cat.label}
                onChange={(e) => updateCategory(cat.id, e.target.value)}
                placeholder={`Category ${i + 1}`}
                className="flex-1"
              />
              {section.categories.length > 2 && (
                <button type="button" onClick={() => removeCategory(cat.id)} className="text-destructive text-sm px-1">✕</button>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addCategory}>+ Add category</Button>
        </div>
      </div>
      <div>
        <Label>Items <span className="text-muted-foreground/80 font-normal">(assign each to a category)</span></Label>
        <div className="mt-1 space-y-2">
          {section.items.map((item, i) => (
            <div key={item.id} className="flex items-center gap-2">
              <Input
                value={item.text}
                onChange={(e) => updateItem(item.id, "text", e.target.value)}
                placeholder={`Item ${i + 1}`}
                className="flex-1"
              />
              <select
                value={item.categoryId}
                onChange={(e) => updateItem(item.id, "categoryId", e.target.value)}
                className={`w-48 ${SELECT_CLASS}`}
              >
                <option value="">Assign category</option>
                {section.categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.label || "(unnamed)"}</option>
                ))}
              </select>
              {section.items.length > 1 && (
                <button type="button" onClick={() => removeItem(item.id)} className="text-destructive text-sm px-1">✕</button>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addItem}>+ Add item</Button>
        </div>
      </div>
    </>
  );
}

// ---------- Main quiz form ----------

function QuizForm({ section, onChange }: { section: QuizSectionDTO; onChange: (s: SectionDTO) => void }) {
  const quizType: QuizType = ("quizType" in section ? section.quizType : "mcq") as QuizType;

  const handleQuizTypeChange = (newType: QuizType) => {
    if (newType === quizType) return;
    const fresh = createEmptyQuizData(newType, {
      id: section.id,
      order: section.order,
      createdAt: section.createdAt,
      updatedAt: section.updatedAt,
    });
    fresh.question = section.question;
    fresh.explanation = section.explanation;
    fresh.points = section.points;
    onChange(fresh);
  };

  const handleChange = (updated: QuizSectionDTO) => onChange(updated);

  return (
    <div className="space-y-3">
      <div>
        <Label>Quiz type</Label>
        <select
          value={quizType}
          onChange={(e) => handleQuizTypeChange(e.target.value as QuizType)}
          className={`mt-1 ${SELECT_CLASS}`}
        >
          {QUIZ_TYPE_LABELS.map(({ type, label }) => (
            <option key={type} value={type}>{label}</option>
          ))}
        </select>
      </div>

      <div>
        <Label>Question</Label>
        <Input
          value={section.question}
          onChange={(e) => onChange({ ...section, question: e.target.value })}
          placeholder="Enter the question"
          className="mt-1"
        />
      </div>

      {quizType === "mcq" && <MCQEditor section={section as MCQQuizSectionDTO} onChange={handleChange} />}
      {quizType === "true-false" && <TrueFalseEditor section={section as TrueFalseQuizSectionDTO} onChange={handleChange} />}
      {quizType === "short-answer" && <ShortAnswerEditor section={section as ShortAnswerQuizSectionDTO} onChange={handleChange} />}
      {quizType === "sequence" && <SequenceEditor section={section as SequenceQuizSectionDTO} onChange={handleChange} />}
      {quizType === "matching" && <MatchingEditor section={section as MatchingQuizSectionDTO} onChange={handleChange} />}
      {quizType === "fill-blank" && <FillBlankEditor section={section as FillBlankQuizSectionDTO} onChange={handleChange} />}
      {quizType === "math-input" && <MathInputEditor section={section as MathInputQuizSectionDTO} onChange={handleChange} />}
      {quizType === "classification" && <ClassificationEditor section={section as ClassificationQuizSectionDTO} onChange={handleChange} />}

      <div>
        <Label>
          Explanation <span className="text-muted-foreground/80 font-normal">(optional)</span>
        </Label>
        <Textarea
          value={section.explanation ?? ""}
          onChange={(e) => onChange({ ...section, explanation: e.target.value })}
          rows={2}
          placeholder="Shown after answering"
          className="mt-1"
        />
      </div>
    </div>
  );
}

// ---------- Main SectionForm ----------

export function SectionForm({ section, onChange }: SectionFormProps) {
  if (section.type === "text") {
    const handleTab = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key !== "Tab") return;
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const indent = "  ";
      const newValue = textarea.value.slice(0, start) + indent + textarea.value.slice(end);
      onChange({ ...section, content: newValue });
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + indent.length;
      });
    };

    return (
      <div className="space-y-3">
        <div>
          <Label>Content</Label>
          <Textarea
            value={section.content}
            onChange={(e) => onChange({ ...section, content: e.target.value })}
            onKeyDown={handleTab}
            rows={8}
            placeholder="Write your content here\u2026"
            className="mt-1 font-mono text-xs"
          />
        </div>
        <div>
          <Label>Format</Label>
          <select
            value={section.format}
            onChange={(e) =>
              onChange({ ...section, format: e.target.value as "markdown" | "html" | "plain" })
            }
            className={`mt-1 ${SELECT_CLASS}`}
          >
            <option value="markdown">Markdown</option>
            <option value="plain">Plain text</option>
            <option value="html">HTML</option>
          </select>
        </div>
      </div>
    );
  }

  if (section.type === "image") {
    return (
      <div className="space-y-3">
        <div>
          <Label>Image URL</Label>
          <Input
            value={section.url}
            onChange={(e) => onChange({ ...section, url: e.target.value })}
            placeholder="https://\u2026"
            className="mt-1"
          />
        </div>
        <div>
          <Label>Alt text</Label>
          <Input
            value={section.alt ?? ""}
            onChange={(e) => onChange({ ...section, alt: e.target.value })}
            placeholder="Describe the image"
            className="mt-1"
          />
        </div>
        <div>
          <Label>Caption</Label>
          <Input
            value={section.caption ?? ""}
            onChange={(e) => onChange({ ...section, caption: e.target.value })}
            placeholder="Optional caption"
            className="mt-1"
          />
        </div>
      </div>
    );
  }

  if (section.type === "video") {
    return (
      <div className="space-y-3">
        <div>
          <Label>Video URL</Label>
          <Input
            value={section.url}
            onChange={(e) => onChange({ ...section, url: e.target.value })}
            placeholder="https://\u2026"
            className="mt-1"
          />
        </div>
        <div>
          <Label>Caption</Label>
          <Input
            value={section.caption ?? ""}
            onChange={(e) => onChange({ ...section, caption: e.target.value })}
            placeholder="Optional caption"
            className="mt-1"
          />
        </div>
      </div>
    );
  }

  if (section.type === "embedding") {
    return (
      <div className="space-y-3">
        <div>
          <Label>Embed URL</Label>
          <Input
            value={section.url}
            onChange={(e) => onChange({ ...section, url: e.target.value })}
            placeholder="https://\u2026"
            className="mt-1"
          />
        </div>
        <div>
          <Label>Type</Label>
          <select
            value={section.embedType}
            onChange={(e) =>
              onChange({
                ...section,
                embedType: e.target.value as "youtube" | "vimeo" | "codepen" | "codesandbox" | "other",
              })
            }
            className={`mt-1 ${SELECT_CLASS}`}
          >
            <option value="youtube">YouTube</option>
            <option value="vimeo">Vimeo</option>
            <option value="codepen">CodePen</option>
            <option value="codesandbox">CodeSandbox</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <Label>Title</Label>
          <Input
            value={section.title ?? ""}
            onChange={(e) => onChange({ ...section, title: e.target.value })}
            placeholder="Optional title"
            className="mt-1"
          />
        </div>
      </div>
    );
  }

  if (section.type === "code") {
    return (
      <div className="space-y-3">
        <div>
          <Label>Language</Label>
          <Input
            value={section.language}
            onChange={(e) => onChange({ ...section, language: e.target.value })}
            placeholder="e.g. javascript, python"
            className="mt-1"
          />
        </div>
        <div>
          <Label>Code</Label>
          <Textarea
            value={section.code}
            onChange={(e) => onChange({ ...section, code: e.target.value })}
            rows={8}
            placeholder="Paste your code here\u2026"
            className="mt-1 font-mono text-xs"
          />
        </div>
      </div>
    );
  }

  if (section.type === "quiz") {
    return <QuizForm section={section} onChange={onChange} />;
  }

  return null;
}
