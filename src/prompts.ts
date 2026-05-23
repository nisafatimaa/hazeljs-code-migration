import { PromptRegistry, PromptTemplate } from '@hazeljs/prompts';

export const MIGRATION_ANALYSIS_PROMPT_KEY = 'code-migration:analysis';
export const MIGRATION_STRATEGY_PROMPT_KEY = 'code-migration:strategy';
export const MIGRATION_REVIEW_PROMPT_KEY = 'code-migration:review';

PromptRegistry.register(
  MIGRATION_ANALYSIS_PROMPT_KEY,
  new PromptTemplate<{ sourcePath: string; detectedFramework: string; filesAnalyzed: number }>(
    [
      'Analyze the source project at {sourcePath}.',
      'Detected framework: {detectedFramework}.',
      'Files analyzed: {filesAnalyzed}.',
      'Identify migration risks, unsupported patterns, and recommended migration targets.',
    ].join('\n'),
    {
      name: 'Code Migration Analysis',
      version: '1.0.0',
    }
  )
);

PromptRegistry.register(
  MIGRATION_STRATEGY_PROMPT_KEY,
  new PromptTemplate<{ sourceFramework: string; targetFramework: string; filePath: string }>(
    [
      'Plan a safe migration from {sourceFramework} to {targetFramework}.',
      'Current file: {filePath}.',
      'Preserve behavior, flag risky framework-specific APIs, and prefer explicit TODOs over unsafe rewrites.',
    ].join('\n'),
    {
      name: 'Framework Migration Strategy',
      version: '1.0.0',
    }
  )
);

PromptRegistry.register(
  MIGRATION_REVIEW_PROMPT_KEY,
  new PromptTemplate<{ targetFramework: string; migratedFiles: number; warnings: string }>(
    [
      'Review the migrated output for {targetFramework}.',
      'Migrated files: {migratedFiles}.',
      '{#if warnings}Known warnings:\n{warnings}{/if}',
      'Return the most important manual verification steps.',
    ].join('\n'),
    {
      name: 'Migration Review',
      version: '1.0.0',
    }
  )
);

export function renderPrompt<TVariables extends object>(
  key: string,
  variables: TVariables
): string {
  return PromptRegistry.get<TVariables>(key).render(variables, { strict: true });
}
