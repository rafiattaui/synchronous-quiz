import type { Question } from './quizinterface.ts';

export const SAMPLE_QUESTIONS: Question[] = [
  {
    questionId: '1',
    order: 1,
    question:
      "Which programming language is known as the 'superset' of JavaScript?",
    options: ['Java', 'Python', 'TypeScript', 'C#'],
    correctAnswer: 2, // TypeScript
  },
  {
    questionId: '2',
    order: 2,
    question:
      'What is the time complexity of looking up a value in a Map by its key?',
    options: ['O(n)', 'O(1)', 'O(log n)', 'O(n^2)'],
    correctAnswer: 1, // O(1)
  },
  {
    questionId: '3',
    order: 3,
    question: "In the context of APIs, what does 'REST' stand for?",
    options: [
      'Rapid Encryption Standard Transfer',
      'Relational State Transfer',
      'Representational State Transfer',
      'Real-time Exchange System Type',
    ],
    correctAnswer: 2, // Representational State Transfer
  },
  {
    questionId: '4',
    order: 4,
    question: 'Which of these is NOT a valid React Hook?',
    options: ['useEffect', 'useState', 'useContext', 'useController'],
    correctAnswer: 3, // useController
  },
  {
    questionId: '5',
    order: 5,
    question: "What does the 'L' in SOLID principles stand for?",
    options: [
      'Liskov Substitution',
      'Logical Ordering',
      'Layered Integration',
      'Linear Optimization',
    ],
    correctAnswer: 0, // Liskov Substitution
  },
];
