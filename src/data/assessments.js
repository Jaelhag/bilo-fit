// =============================================================================
//  ASSESSMENTS
//  The self-check questions that drive drill selection. Each answer steers a
//  branch of the course's decision tree (see lib/engine.js).
//
//  Side Split is the real, verified tree. Other goals use a single "where are
//  you?" question and a sensible beginner default until their exact trees are
//  pulled from the course.
// =============================================================================

export const ASSESSMENTS = {
  'pancake': [
    {
      id: 'pcCalves',
      q: "In Tailor's Pose (seated butterfly, soles together), do BOTH calves lie flat on the floor?",
      help: 'This determines your B1 drill — the main loaded stretch.',
      options: [
        { value: 'no', label: 'No, calves are off the floor' },
        { value: 'yes', label: 'Yes, both flat' },
      ],
    },
    {
      id: 'pcDepth',
      q: 'Which picture best matches your seated pancake (wide straddle, fold forward)?',
      help: 'Sit on the floor, legs wide, and fold forward as far as you can. Pick the closest match.',
      options: [
        { value: 'over90', label: 'Torso above 90° — upright, hardly folding' },
        { value: 'under90', label: 'Between upright and 90° — some fold, not reaching far' },
        { value: 'head', label: 'Head touches or nearly touches the floor' },
        { value: 'chest', label: 'Chest reaches the floor' },
      ],
    },
    {
      id: 'pcLiftDiff',
      q: 'Sit in a narrow pancake and lift one leg. Now try a full wide pancake lift. Is there more than ~20° difference?',
      help: 'Only matters if your torso is above 90° or just under. If not sure, choose Yes.',
      onlyIf: (a) => a.pcDepth === 'over90' || a.pcDepth === 'under90',
      options: [
        { value: 'yes', label: 'Yes, clearly more range in narrow than wide' },
        { value: 'no', label: 'No, about the same' },
      ],
    },
  ],

  'side-split': [
    {
      id: 'imbalance',
      q: 'Do your left and right sides feel clearly different — one slides noticeably further than the other?',
      help: 'Course threshold: a drop-stance angle that differs by more than ~10° L vs R. If unsure, choose No for now.',
      options: [
        { value: 'no', label: 'No / roughly even' },
        { value: 'yes', label: 'Yes, clearly uneven' },
      ],
    },
    {
      id: 'position',
      q: 'Can you hold the correct side-split position — hips behind the line of your ankles, lower back arched, chest tall?',
      help: 'This is the make-or-break for side splits. If you are not sure you can hold it, choose No and you will drill it first.',
      options: [
        { value: 'no', label: 'No, not yet' },
        { value: 'yes', label: 'Yes, I can hold it' },
      ],
    },
    {
      id: 'tailorsCalves',
      q: "In Tailor's Pose (seated butterfly), do BOTH calves lie flat against the floor?",
      options: [
        { value: 'no', label: 'No' },
        { value: 'yes', label: 'Yes, both flat' },
      ],
    },
    {
      id: 'pancakeHead',
      q: 'In a seated pancake (wide straddle, fold forward), does your head reach the floor?',
      options: [
        { value: 'no', label: 'No' },
        { value: 'yes', label: 'Yes, head to floor' },
      ],
    },
    {
      id: 'pancakeDepth',
      q: 'How deep is your seated pancake fold right now?',
      help: 'Only matters if your head does not yet reach the floor.',
      onlyIf: (a) => a.pancakeHead === 'no',
      options: [
        { value: 'limited', label: 'Quite limited — far from the floor' },
        { value: 'deep', label: 'Past halfway down (torso under ~45°)' },
      ],
    },
    {
      id: 'heldTime',
      q: 'Can you already hold your end-range positions for the full prescribed time?',
      onlyIf: (a) => a.pancakeHead === 'yes',
      options: [
        { value: 'no', label: 'No' },
        { value: 'yes', label: 'Yes' },
      ],
    },
    {
      id: 'handsDiff',
      q: 'Is there less than ~20° difference between your hands-supported and hands-free side split?',
      onlyIf: (a) => a.pancakeHead === 'yes' && a.heldTime === 'yes',
      options: [
        { value: 'yes', label: 'Yes, less than 20°' },
        { value: 'no', label: 'No, big difference' },
      ],
    },
  ],
}

// Single-question fallback for the draft goals.
export const DEFAULT_ASSESSMENT = [
  {
    id: 'level',
    q: 'Where are you with this goal right now?',
    options: [
      { value: 'beginner', label: 'Beginner — limited range' },
      { value: 'intermediate', label: 'Some range, building' },
      { value: 'advanced', label: 'Close to the end goal' },
    ],
  },
]

export function questionsFor(goalId) {
  return ASSESSMENTS[goalId] || DEFAULT_ASSESSMENT
}

// Which questions are currently visible given the answers so far (handles onlyIf).
export function visibleQuestions(goalId, answers) {
  return questionsFor(goalId).filter((q) => !q.onlyIf || q.onlyIf(answers))
}
