"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  QuizSectionDTO,
  SectionDTO,
  QuizType,
  MCQQuizSectionDTO,
  TrueFalseQuizSectionDTO,
  ShortAnswerQuizSectionDTO,
  SequenceQuizSectionDTO,
  MatchingQuizSectionDTO,
  FillBlankQuizSectionDTO,
  MathInputQuizSectionDTO,
  ClassificationQuizSectionDTO,
} from "@/lib/api";
import { createEmptyQuizData, QUIZ_TYPE_LABELS, SELECT_CLASS } from "./utils";
import {
  MCQEditor,
  TrueFalseEditor,
  ShortAnswerEditor,
  SequenceEditor,
  MatchingEditor,
  FillBlankEditor,
  MathInputEditor,
  ClassificationEditor,
} from "./quiz-editors";

interface QuizFormProps {
  section: QuizSectionDTO;
  onChange: (s: SectionDTO) => void;
}

export function QuizForm({ section, onChange }: QuizFormProps) {
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
