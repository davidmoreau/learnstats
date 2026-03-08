"use client";

import { useMemo, useState } from "react";

type Question = {
  prompt: string;
  options: string[];
  answer: number;
};

type QuickCheckProps = {
  title?: string;
  questions: Question[];
};

export function QuickCheck({ title = "Quick Check", questions }: QuickCheckProps) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const correctCount = useMemo(
    () =>
      questions.reduce((acc, q, idx) => {
        return answers[idx] === q.answer ? acc + 1 : acc;
      }, 0),
    [answers, questions]
  );

  return (
    <section className="quickcheck">
      <h3>{title}</h3>
      {questions.map((q, idx) => {
        const selected = answers[idx];
        const hasAnswer = selected !== undefined;
        const isCorrect = hasAnswer && selected === q.answer;

        return (
          <fieldset key={q.prompt}>
            <legend>{idx + 1}. {q.prompt}</legend>
            {q.options.map((option, optionIdx) => (
              <label key={option} style={{ display: "block", marginTop: "0.3rem" }}>
                <input
                  type="radio"
                  name={`q-${idx}`}
                  value={optionIdx}
                  checked={selected === optionIdx}
                  onChange={() => setAnswers((prev) => ({ ...prev, [idx]: optionIdx }))}
                />{" "}
                {option}
              </label>
            ))}
            {hasAnswer ? (
              <p className="feedback">{isCorrect ? "Correct." : `Not quite. Correct answer: ${q.options[q.answer]}.`}</p>
            ) : null}
          </fieldset>
        );
      })}

      <p className="feedback">
        Score this session: {correctCount}/{questions.length}
      </p>
    </section>
  );
}
