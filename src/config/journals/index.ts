import type { Examples } from "../../types/rules";

// Flexible configuration for Programmatic Rules
// Uses Record to allow any structure per journal
export type ProgrammaticConfig = Record<string, any>;

// Configuration for Semantic Rules (15 rules)
export interface SemanticGuideline {
    description: string;
    examples: Examples;
}

export type SemanticConfig = Record<string, SemanticGuideline>;

export interface JournalConfig {
    id: string;
    name: string;
    publisher: string;
    programmatic: ProgrammaticConfig;
    semantic: SemanticConfig;
}

// Registry of all journal configurations
export const JOURNALS: Record<string, JournalConfig> = {};

export function registerJournal(config: JournalConfig) {
    JOURNALS[config.id] = config;
}
