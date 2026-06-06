import Groq from "groq-sdk";

export interface GeneratedQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface CourseOutlineLesson {
  title: string;
  keyConcepts: string[];
  suggestedQuestions: string[];
  durationMinutes: number;
}

export interface CourseOutline {
  title: string;
  description: string;
  lessons: CourseOutlineLesson[];
}

const getClient = (): Groq => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey)
    throw new Error("GROQ_API_KEY is not set in environment variables");
  return new Groq({ apiKey });
};

const cleanJson = (text: string): string => {
  // Remove markdown fences
  let cleaned = text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  // Extract just the JSON object if Groq added surrounding text
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  return cleaned;
};

export const generateQuestions = async (
  lessonContent: string,
  count: number = 5,
  level: string = "beginner",
): Promise<GeneratedQuestion[]> => {
  const client = getClient();

  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 4096,
    messages: [
      {
        role: "system",
        content:
          "You are a JSON API. You only respond with valid JSON. No markdown, no explanations, no preamble. Just raw JSON.",
      },
      {
        role: "user",
        content: `Generate ${count} multiple choice questions for this lesson content at ${level} level.

Rules:
- Questions must be answerable from the lesson text only
- Use simple, clear language
- Each question must have exactly 4 options
- Only one option is correct
- Explanations must reference the lesson content
- Avoid trick questions

Lesson content:
${lessonContent}

Respond with this exact JSON structure and nothing else:
{
  "questions": [
    {
      "question": "...",
      "options": ["...", "...", "...", "..."],
      "correctIndex": 0,
      "explanation": "..."
    }
  ]
}`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content || "";
  console.log("Groq raw response (questions):", raw.slice(0, 300));

  const text = cleanJson(raw);

  let parsed: { questions: GeneratedQuestion[] };
  try {
    parsed = JSON.parse(text);
  } catch {
    console.error("Failed to parse JSON. Raw:", raw);
    console.error("Cleaned:", text);
    throw new Error("AI returned invalid JSON. Please try again.");
  }

  if (!parsed.questions || !Array.isArray(parsed.questions)) {
    throw new Error("AI response did not contain a valid questions array");
  }

  return parsed.questions
    .filter((q: GeneratedQuestion) => {
      if (!Array.isArray(q.options) || q.options.length < 4) return false;
      if (!q.question) return false;
      if (q.correctIndex === undefined || q.correctIndex === null) return false;
      return true;
    })
    .map((q: GeneratedQuestion) => ({
      question: q.question,
      options: q.options.slice(0, 4),
      correctIndex: Math.min(Math.max(Number(q.correctIndex), 0), 3),
      explanation: q.explanation || "",
    }));
};

export const generateCourseOutline = async (
  topic: string,
  subject: string,
  level: string = "beginner",
): Promise<CourseOutline> => {
  const client = getClient();

  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 4096,
    messages: [
      {
        role: "system",
        content:
          "You are a JSON API. You only respond with valid JSON. No markdown, no explanations, no preamble. Just raw JSON.",
      },
      {
        role: "user",
        content: `Create a complete course outline for the topic "${topic}" in the subject area "${subject}" at the ${level} level.

Requirements:
- 5 to 10 lessons in logical learning order
- Each lesson covers one key concept
- Include 2-3 key concepts per lesson
- Suggest 2-3 quiz questions per lesson
- Estimate duration per lesson (5-15 minutes)
- Use simple, accessible language

Respond with this exact JSON structure and nothing else:
{
  "title": "Course Title",
  "description": "2-3 sentence course description",
  "lessons": [
    {
      "title": "Lesson Title",
      "keyConcepts": ["concept 1", "concept 2"],
      "suggestedQuestions": ["question 1?", "question 2?"],
      "durationMinutes": 10
    }
  ]
}`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content || "";
  console.log("Groq raw response (outline):", raw.slice(0, 300));

  const text = cleanJson(raw);

  let parsed: CourseOutline;
  try {
    parsed = JSON.parse(text);
  } catch {
    console.error("Failed to parse JSON. Raw:", raw);
    console.error("Cleaned:", text);
    throw new Error("AI returned invalid JSON. Please try again.");
  }

  if (!parsed.title || !parsed.lessons || !Array.isArray(parsed.lessons)) {
    throw new Error("AI response did not contain a valid course outline");
  }

  return parsed;
};