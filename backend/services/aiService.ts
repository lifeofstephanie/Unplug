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
  return text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
};

export const generateQuestions = async (
  lessonContent: string,
  count: number = 5,
  level: string = "beginner",
): Promise<GeneratedQuestion[]> => {
  const client = getClient();

  const response = await client.chat.completions.create({
    model: "llama-3.1-8b-instant",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `You are an educational content creator for Unplug, a community learning platform serving learners in underserved communities.

Given the following lesson content, generate ${count} multiple choice questions.

Rules:
- Questions must be answerable from the lesson text only
- Use simple, clear language appropriate for ${level} level
- Each question must have exactly 4 options
- Only one option is correct
- Explanations must reference the lesson content
- Avoid trick questions — test understanding, not memory

Lesson content:
${lessonContent}

Return ONLY valid JSON in this exact structure, no preamble, no markdown fences:
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

  const text = cleanJson(response.choices[0]?.message?.content || "");

  let parsed: { questions: GeneratedQuestion[] };
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("AI returned invalid JSON. Please try again.");
  }

  if (!parsed.questions || !Array.isArray(parsed.questions)) {
    throw new Error("AI response did not contain a valid questions array");
  }

  return parsed.questions
    .filter((q: GeneratedQuestion) => {
      // Drop any question that doesn't have exactly 4 options
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
    model: "llama-3.1-8b-instant",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are an educational content architect for Unplug, a community learning platform for underserved communities.

Create a complete course outline for the topic "${topic}" in the subject area "${subject}" at the ${level} level.

Requirements:
- 5 to 10 lessons in logical learning order
- Each lesson should cover one key concept
- Include 2-3 key concepts per lesson
- Suggest 2-3 quiz questions per lesson (just the question text)
- Estimate duration per lesson (5-15 minutes)
- Use simple, accessible language

Return ONLY valid JSON in this exact structure, no preamble, no markdown fences:
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

  const text = cleanJson(response.choices[0]?.message?.content || "");

  let parsed: CourseOutline;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("AI returned invalid JSON. Please try again.");
  }

  if (!parsed.title || !parsed.lessons || !Array.isArray(parsed.lessons)) {
    throw new Error("AI response did not contain a valid course outline");
  }

  return parsed;
};
