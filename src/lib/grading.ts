import type {
  CorrectAnswer,
  QuestionOptions,
  SnapshotQuestion,
  StudentAnswer,
} from "@/lib/types";
import { normalizeText } from "@/lib/utils";

export type GradeResult = {
  pointsEarned: number;
  pointsPossible: number;
  scorePercent: number;
  needsReview: boolean;
  details: {
    questionId: number;
    points: number;
    earned: number;
    correct: boolean | "pending";
  }[];
};

function asAnswer(value: unknown): StudentAnswer {
  if (!value || typeof value !== "object") return {};
  return value as StudentAnswer;
}

function sameSet(a: string[] = [], b: string[] = []) {
  if (a.length !== b.length) return false;
  const left = [...a].sort();
  const right = [...b].sort();
  return left.every((item, index) => item === right[index]);
}

export function gradeAttempt(
  questions: SnapshotQuestion[],
  answers: Record<string, StudentAnswer | null>,
): GradeResult {
  let pointsEarned = 0;
  let pointsPossible = 0;
  let needsReview = false;
  const details: GradeResult["details"] = [];

  for (const question of questions) {
    pointsPossible += question.points;
    const submitted = asAnswer(answers[String(question.id)]);
    const key = question.correctAnswer;
    let earned = 0;
    let correct: boolean | "pending" = false;

    switch (question.type) {
      case "multiple_choice": {
        correct = Boolean(key?.choiceId && submitted.choiceId === key.choiceId);
        earned = correct ? question.points : 0;
        break;
      }
      case "multiple_select": {
        correct = sameSet(key?.choiceIds ?? [], submitted.choiceIds ?? []);
        earned = correct ? question.points : 0;
        break;
      }
      case "true_false": {
        correct = key?.bool === submitted.bool;
        earned = correct ? question.points : 0;
        break;
      }
      case "short_answer": {
        const expected = normalizeText(key?.text ?? "");
        const given = normalizeText(submitted.text ?? "");
        correct = expected.length > 0 && expected === given;
        earned = correct ? question.points : 0;
        break;
      }
      case "fill_blank": {
        const expected = (key?.texts ?? []).map(normalizeText);
        const given = (submitted.texts ?? []).map(normalizeText);
        correct =
          expected.length > 0 &&
          expected.length === given.length &&
          expected.every((item, index) => item === given[index]);
        earned = correct ? question.points : 0;
        break;
      }
      case "matching": {
        const expected = key?.matches ?? {};
        const given = submitted.matches ?? {};
        const keys = Object.keys(expected);
        correct =
          keys.length > 0 && keys.every((leftId) => expected[leftId] === given[leftId]);
        earned = correct ? question.points : 0;
        break;
      }
      case "essay": {
        const written = (submitted.text ?? "").trim();
        if (written.length >= 40) {
          correct = "pending";
          needsReview = true;
        } else {
          correct = false;
        }
        earned = 0;
        break;
      }
      default:
        correct = false;
    }

    if (typeof earned === "number" && correct === true) {
      pointsEarned += earned;
    }

    details.push({
      questionId: question.id,
      points: question.points,
      earned: correct === true ? question.points : 0,
      correct,
    });
  }

  const scorePercent =
    pointsPossible === 0 ? 0 : Math.round((pointsEarned / pointsPossible) * 100);

  return { pointsEarned, pointsPossible, scorePercent, needsReview, details };
}

export function publicQuestion(question: SnapshotQuestion) {
  return {
    id: question.id,
    type: question.type,
    prompt: question.prompt,
    options: question.options as QuestionOptions | null,
    points: question.points,
  };
}

export function snapshotQuestions(
  snapshot: Record<string, unknown> | null | undefined,
): SnapshotQuestion[] {
  const questions = snapshot?.questions;
  return Array.isArray(questions) ? (questions as SnapshotQuestion[]) : [];
}
