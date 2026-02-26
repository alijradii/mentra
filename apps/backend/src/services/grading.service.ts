import type { QuestionAnswer, Section, QuizSection } from "shared";

interface GradeResult {
  answers: QuestionAnswer[];
  autoScore: number;
  maxScore: number;
}

/**
 * Auto-grade a set of student answers against the quiz sections in a node.
 * Returns graded answers with isCorrect/autoScore/maxScore per question, plus totals.
 */
export function autoGradeSubmission(
  sections: Section[],
  rawAnswers: QuestionAnswer[]
): GradeResult {
  const answerMap = new Map(rawAnswers.map((a) => [a.sectionId, a]));
  const gradedAnswers: QuestionAnswer[] = [];
  let totalAutoScore = 0;
  let totalMaxScore = 0;

  for (const section of sections) {
    if (section.type !== "quiz") continue;
    const quiz = section as QuizSection;
    const maxPoints = quiz.points ?? 10;
    const studentAnswer = answerMap.get(quiz.id);

    totalMaxScore += maxPoints;

    if (!studentAnswer) {
      gradedAnswers.push({
        sectionId: quiz.id,
        answer: null,
        isCorrect: false,
        autoScore: 0,
        maxScore: maxPoints,
      });
      continue;
    }

    const { isCorrect, score } = gradeQuestion(quiz, studentAnswer.answer);
    const autoScore = Math.round(score * maxPoints * 100) / 100;
    totalAutoScore += autoScore;

    gradedAnswers.push({
      sectionId: quiz.id,
      answer: studentAnswer.answer,
      isCorrect,
      autoScore,
      maxScore: maxPoints,
    });
  }

  return {
    answers: gradedAnswers,
    autoScore: totalAutoScore,
    maxScore: totalMaxScore,
  };
}

/**
 * Grade a single question. Returns isCorrect (boolean) and score (0-1 fraction).
 */
function gradeQuestion(
  quiz: QuizSection,
  answer: unknown
): { isCorrect: boolean; score: number } {
  switch (quiz.quizType) {
    case "mcq":
      return gradeMCQ(quiz.correctAnswers, answer);
    case "true-false":
      return gradeTrueFalse(quiz.correctAnswer, answer);
    case "short-answer":
      return gradeShortAnswer(
        quiz.acceptedAnswers,
        answer,
        quiz.caseSensitive,
        quiz.trimWhitespace
      );
    case "sequence":
      return gradeSequence(quiz.correctOrder, answer);
    case "matching":
      return gradeMatching(quiz.pairs, answer);
    case "fill-blank":
      return gradeFillBlank(quiz.blanks, answer);
    case "math-input":
      return gradeMathInput(quiz.acceptedAnswers, answer);
    case "classification":
      return gradeClassification(quiz.items, answer);
    default:
      return { isCorrect: false, score: 0 };
  }
}

function gradeMCQ(
  correctAnswers: string[],
  answer: unknown
): { isCorrect: boolean; score: number } {
  if (!Array.isArray(answer)) return { isCorrect: false, score: 0 };
  const selected = answer as string[];
  const correct = new Set(correctAnswers);
  const isCorrect =
    selected.length === correct.size &&
    selected.every((id) => correct.has(id));
  return { isCorrect, score: isCorrect ? 1 : 0 };
}

function gradeTrueFalse(
  correctAnswer: boolean,
  answer: unknown
): { isCorrect: boolean; score: number } {
  const isCorrect = answer === correctAnswer;
  return { isCorrect, score: isCorrect ? 1 : 0 };
}

function gradeShortAnswer(
  acceptedAnswers: string[],
  answer: unknown,
  caseSensitive?: boolean,
  trimWhitespace?: boolean
): { isCorrect: boolean; score: number } {
  if (typeof answer !== "string") return { isCorrect: false, score: 0 };
  let studentAnswer = answer;
  if (trimWhitespace !== false) studentAnswer = studentAnswer.trim();

  const isCorrect = acceptedAnswers.some((accepted) => {
    let a = accepted;
    if (trimWhitespace !== false) a = a.trim();
    if (caseSensitive) return studentAnswer === a;
    return studentAnswer.toLowerCase() === a.toLowerCase();
  });
  return { isCorrect, score: isCorrect ? 1 : 0 };
}

function gradeSequence(
  correctOrder: string[],
  answer: unknown
): { isCorrect: boolean; score: number } {
  if (!Array.isArray(answer)) return { isCorrect: false, score: 0 };
  const studentOrder = answer as string[];
  if (studentOrder.length !== correctOrder.length)
    return { isCorrect: false, score: 0 };

  let correctCount = 0;
  for (let i = 0; i < correctOrder.length; i++) {
    if (studentOrder[i] === correctOrder[i]) correctCount++;
  }
  const isCorrect = correctCount === correctOrder.length;
  return { isCorrect, score: correctCount / correctOrder.length };
}

function gradeMatching(
  pairs: { id: string; left: string; right: string }[],
  answer: unknown
): { isCorrect: boolean; score: number } {
  if (typeof answer !== "object" || answer === null)
    return { isCorrect: false, score: 0 };
  const studentPairs = answer as Record<string, string>;
  let correctCount = 0;
  for (const pair of pairs) {
    if (studentPairs[pair.id] === pair.right) correctCount++;
  }
  const isCorrect = correctCount === pairs.length;
  return { isCorrect, score: pairs.length > 0 ? correctCount / pairs.length : 0 };
}

function gradeFillBlank(
  blanks: { id: string; acceptedAnswers: string[] }[],
  answer: unknown
): { isCorrect: boolean; score: number } {
  if (typeof answer !== "object" || answer === null)
    return { isCorrect: false, score: 0 };
  const studentBlanks = answer as Record<string, string>;
  let correctCount = 0;
  for (const blank of blanks) {
    const studentVal = (studentBlanks[blank.id] ?? "").trim().toLowerCase();
    const matches = blank.acceptedAnswers.some(
      (a) => a.trim().toLowerCase() === studentVal
    );
    if (matches) correctCount++;
  }
  const isCorrect = correctCount === blanks.length;
  return { isCorrect, score: blanks.length > 0 ? correctCount / blanks.length : 0 };
}

function gradeMathInput(
  acceptedAnswers: string[],
  answer: unknown
): { isCorrect: boolean; score: number } {
  if (typeof answer !== "string") return { isCorrect: false, score: 0 };
  const normalized = answer.replace(/\s+/g, "");
  const isCorrect = acceptedAnswers.some(
    (a) => a.replace(/\s+/g, "") === normalized
  );
  return { isCorrect, score: isCorrect ? 1 : 0 };
}

function gradeClassification(
  items: { id: string; text: string; categoryId: string }[],
  answer: unknown
): { isCorrect: boolean; score: number } {
  if (typeof answer !== "object" || answer === null)
    return { isCorrect: false, score: 0 };
  const studentClassification = answer as Record<string, string>;
  let correctCount = 0;
  for (const item of items) {
    if (studentClassification[item.id] === item.categoryId) correctCount++;
  }
  const isCorrect = correctCount === items.length;
  return { isCorrect, score: items.length > 0 ? correctCount / items.length : 0 };
}
