export type HookCategory = 
  | 'opening' 
  | 'storytelling' 
  | 'transition' 
  | 'suspense' 
  | 'emotional' 
  | 'payoff' 
  | 'viral';

export interface Hook {
  id: string;
  category: HookCategory;
  word: string;
  purpose: string;
  whenToUse: string;
  example: string;
}

export interface ScriptSection {
  id: string;
  type: 'hook' | 'body' | 'transition' | 'payoff';
  content: string;
}

export interface ExampleScript {
  id: string;
  title: string;
  description: string;
  content: string;
  category: HookCategory;
}

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}
