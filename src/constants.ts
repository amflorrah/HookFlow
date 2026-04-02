import { Hook, HookCategory, ExampleScript } from './types';

export const HOOK_CATEGORIES = [
  { id: 'opening', label: 'Opening Hooks', icon: 'Zap', description: 'First 3-10 seconds to stop the scroll.' },
  { id: 'storytelling', label: 'Storytelling', icon: 'BookOpen', description: 'Keep them watching through the middle.' },
  { id: 'transition', label: 'Transitions', icon: 'ArrowRightLeft', description: 'Seamlessly move between ideas.' },
  { id: 'suspense', label: 'Suspense & Mystery', icon: 'EyeOff', description: 'Build tension and curiosity.' },
  { id: 'emotional', label: 'Emotional', icon: 'Heart', description: 'Connect on a deeper level.' },
  { id: 'payoff', label: 'Payoff Hooks', icon: 'Trophy', description: 'Satisfying endings that stick.' },
  { id: 'viral', label: 'Viral Retention', icon: 'TrendingUp', description: 'Proven high-retention patterns.' },
] as const;

export const HOOKS: Hook[] = [
  {
    id: '1',
    category: 'opening',
    word: 'Imagine',
    purpose: 'Forces the viewer to visualize a scenario immediately.',
    whenToUse: 'Start of a video to set a hypothetical scene.',
    example: 'Imagine waking up with $10,000 in your bank account...'
  },
  {
    id: '2',
    category: 'opening',
    word: 'Stop',
    purpose: 'Pattern interrupt that commands attention.',
    whenToUse: 'When you want to debunk a common myth.',
    example: 'Stop wasting your time on generic hooks.'
  },
  {
    id: '3',
    category: 'storytelling',
    word: 'But then',
    purpose: 'Creates a sudden shift in the narrative.',
    whenToUse: 'After establishing a status quo.',
    example: 'Everything was going perfectly. But then, I got the call.'
  },
  {
    id: '4',
    category: 'transition',
    word: 'Which leads to',
    purpose: 'Logical bridge between two points.',
    whenToUse: 'Connecting a problem to a solution.',
    example: 'Which leads to the one tool that changed everything.'
  },
  {
    id: '5',
    category: 'suspense',
    word: 'Until',
    purpose: 'Creates a time-bound mystery.',
    whenToUse: 'Before a major reveal.',
    example: 'I thought I knew the truth. Until I opened the door.'
  },
  {
    id: '6',
    category: 'viral',
    word: 'The secret is',
    purpose: 'Implies exclusive knowledge.',
    whenToUse: 'Revealing a key insight.',
    example: 'The secret is not what you do, but how you do it.'
  },
  {
    id: '7',
    category: 'opening',
    word: 'Unpopular Opinion',
    purpose: 'Polarizes the audience and sparks curiosity/debate.',
    whenToUse: 'Challenging a common belief in your niche.',
    example: 'Unpopular opinion: Most creators are focusing on the wrong metrics.'
  },
  {
    id: '8',
    category: 'suspense',
    word: 'Nobody noticed',
    purpose: 'Implies a hidden detail that the viewer missed.',
    whenToUse: 'Analyzing a famous event or person.',
    example: 'Everyone saw the announcement, but nobody noticed this one detail.'
  },
  {
    id: '9',
    category: 'emotional',
    word: 'I was wrong',
    purpose: 'Humanizes the creator and builds trust through vulnerability.',
    whenToUse: 'Admitting a mistake or a change in perspective.',
    example: 'For three years, I thought I was doing it right. I was wrong.'
  },
  {
    id: '10',
    category: 'payoff',
    word: 'The result?',
    purpose: 'Signals the final transformation or outcome.',
    whenToUse: 'Before showing the final success of a project.',
    example: 'I followed the plan for 30 days. The result? A 400% increase in sales.'
  }
];

export const SMART_INSERTS = [
  'but—', 'then—', 'until—', 'suddenly—', 'however—', 'because—', 'instead—'
];

export const EXAMPLES: ExampleScript[] = [
  {
    id: 'ex1',
    title: 'The Mystery Box',
    description: 'A classic suspense-driven opening.',
    category: 'suspense',
    content: 'I spent 30 days inside a locked room. But the real challenge wasn\'t the isolation. It was what I found under the floorboards. Most people would have quit on day 3, but I had to know... until the final hour changed everything.'
  },
  {
    id: 'ex2',
    title: 'The Transformation',
    description: 'Emotional payoff storytelling.',
    category: 'emotional',
    content: 'I used to be terrified of public speaking. Imagine standing in front of 500 people with a blank mind. That was me. Which leads to the one habit that fixed it forever. Now, I don\'t just speak; I lead.'
  }
];
