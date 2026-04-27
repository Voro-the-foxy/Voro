// MOCK IMPLEMENTATION — hardcoded in-memory quiz catalog and questions.
// Three classes (Algorithms / Databases / Networks), 5 questions each.
// This entire module is throwaway data; replace per the TODO(backend)
// markers below once the backend exposes the catalog and quiz endpoints.
import type { Quiz, QuizClass } from "@/types/quiz";

// TODO(backend): GET /api/quiz/classes
//                Response: QuizClass[] = [{ id, name, lectureTitle }]
//                Catalog of quizzes the user can take. Drives QuizSelectPage.
//                Likely seeded server-side from notes/lectures the user has uploaded.
export const QUIZ_CLASSES: QuizClass[] = [
  { id: "algorithms", name: "algorithms", lectureTitle: "Algorithms" },
  { id: "databases", name: "databases", lectureTitle: "Databases" },
  { id: "networks", name: "networks", lectureTitle: "Networks" },
];

const QUIZZES: Record<string, Quiz> = {
  algorithms: {
    classId: "algorithms",
    lectureTitle: "Algorithms",
    questions: [
      {
        id: "q1",
        type: "multiple_choice",
        prompt: "What is the time complexity of binary search?",
        choices: ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
        correctIndex: 1,
      },
      {
        id: "q2",
        type: "open_answer",
        prompt: "Explain the divide and conquer paradigm.",
        explanation:
          "Divide a problem into smaller subproblems, solve each recursively, then combine the partial solutions into the final answer.",
      },
      {
        id: "q3",
        type: "multiple_choice",
        prompt: "Which sort has the best average-case complexity?",
        choices: ["Bubble", "Insertion", "Merge", "Selection"],
        correctIndex: 2,
      },
      {
        id: "q4",
        type: "multiple_choice",
        prompt: "Which data structure backs a priority queue?",
        choices: ["Stack", "Heap", "Queue", "Hash map"],
        correctIndex: 1,
      },
      {
        id: "q5",
        type: "open_answer",
        prompt: "Why is quicksort often faster than mergesort in practice?",
        explanation:
          "Quicksort sorts in place with low constant factors and good cache locality, while mergesort needs O(n) auxiliary memory.",
      },
    ],
  },
  databases: {
    classId: "databases",
    lectureTitle: "Databases",
    questions: [
      {
        id: "q1",
        type: "multiple_choice",
        prompt: "Which property guarantees that transactions don't interfere?",
        choices: ["Atomicity", "Consistency", "Isolation", "Durability"],
        correctIndex: 2,
      },
      {
        id: "q2",
        type: "open_answer",
        prompt: "What does normalization aim to achieve?",
        explanation:
          "Normalization removes redundancy and update anomalies by decomposing tables according to functional dependencies.",
      },
      {
        id: "q3",
        type: "multiple_choice",
        prompt: "Which index is best for range queries?",
        choices: ["Hash", "B-Tree", "Bitmap", "Inverted"],
        correctIndex: 1,
      },
      {
        id: "q4",
        type: "multiple_choice",
        prompt: "Which isolation level prevents phantom reads?",
        choices: [
          "Read uncommitted",
          "Read committed",
          "Repeatable read",
          "Serializable",
        ],
        correctIndex: 3,
      },
      {
        id: "q5",
        type: "open_answer",
        prompt: "When is denormalization appropriate?",
        explanation:
          "When read latency dominates and write amplification or staleness is acceptable - typically in analytical or read-heavy systems.",
      },
    ],
  },
  networks: {
    classId: "networks",
    lectureTitle: "Networks",
    questions: [
      {
        id: "q1",
        type: "multiple_choice",
        prompt: "TCP guarantees which of the following?",
        choices: [
          "Low latency",
          "Ordered delivery",
          "Multicast",
          "Unreliable transport",
        ],
        correctIndex: 1,
      },
      {
        id: "q2",
        type: "open_answer",
        prompt: "Describe the three-way handshake.",
        explanation:
          "Client sends SYN; server replies SYN-ACK; client confirms with ACK. Both sides agree on initial sequence numbers before data flows.",
      },
      {
        id: "q3",
        type: "multiple_choice",
        prompt: "Which layer does HTTP belong to?",
        choices: ["Transport", "Network", "Application", "Link"],
        correctIndex: 2,
      },
      {
        id: "q4",
        type: "multiple_choice",
        prompt: "Which protocol resolves domain names?",
        choices: ["DHCP", "DNS", "ARP", "ICMP"],
        correctIndex: 1,
      },
      {
        id: "q5",
        type: "open_answer",
        prompt: "Why is TLS placed below the application layer?",
        explanation:
          "TLS sits on top of TCP and below application protocols so any app-layer protocol can reuse the same authenticated, encrypted channel.",
      },
    ],
  },
};

// TODO(backend): GET /api/quiz/classes/:classId
//                Response: Quiz = { classId, lectureTitle, questions: Question[] }
//                Question is a discriminated union:
//                  - multiple_choice: { id, type, prompt, choices[], correctIndex }
//                  - open_answer:     { id, type, prompt, explanation }
//                Server may withhold correctIndex/explanation until the user answers
//                (separate POST /api/quiz/classes/:classId/answer endpoint) to prevent
//                cheating; current frontend assumes both are inlined.
export const getQuiz = (classId: string): Quiz | undefined => QUIZZES[classId];
