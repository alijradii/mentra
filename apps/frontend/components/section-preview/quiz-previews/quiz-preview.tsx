"use client";

import type { QuizSectionDTO, QuizType } from "@/lib/api";
import type {
  MCQQuizSectionDTO,
  TrueFalseQuizSectionDTO,
  ShortAnswerQuizSectionDTO,
  SequenceQuizSectionDTO,
  MatchingQuizSectionDTO,
  FillBlankQuizSectionDTO,
  MathInputQuizSectionDTO,
  ClassificationQuizSectionDTO,
} from "@/lib/api";
import { MCQPreview } from "./mcq-preview";
import { TrueFalsePreview } from "./true-false-preview";
import { ShortAnswerPreview } from "./short-answer-preview";
import { SequencePreview } from "./sequence-preview";
import { MatchingPreview } from "./matching-preview";
import { FillBlankPreview } from "./fill-blank-preview";
import { MathInputPreview } from "./math-input-preview";
import { ClassificationPreview } from "./classification-preview";

interface QuizPreviewProps {
  section: QuizSectionDTO;
  onAnswered?: () => void;
}

export function QuizPreview({ section, onAnswered }: QuizPreviewProps) {
  const quizType: QuizType = ("quizType" in section ? section.quizType : "mcq") as QuizType;

  const inner = (() => {
    switch (quizType) {
      case "mcq":
        return <MCQPreview section={section as MCQQuizSectionDTO} onAnswered={onAnswered} />;
      case "true-false":
        return <TrueFalsePreview section={section as TrueFalseQuizSectionDTO} onAnswered={onAnswered} />;
      case "short-answer":
        return <ShortAnswerPreview section={section as ShortAnswerQuizSectionDTO} onAnswered={onAnswered} />;
      case "sequence":
        return <SequencePreview section={section as SequenceQuizSectionDTO} onAnswered={onAnswered} />;
      case "matching":
        return <MatchingPreview section={section as MatchingQuizSectionDTO} onAnswered={onAnswered} />;
      case "fill-blank":
        return <FillBlankPreview section={section as FillBlankQuizSectionDTO} onAnswered={onAnswered} />;
      case "math-input":
        return <MathInputPreview section={section as MathInputQuizSectionDTO} onAnswered={onAnswered} />;
      case "classification":
        return <ClassificationPreview section={section as ClassificationQuizSectionDTO} onAnswered={onAnswered} />;
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
