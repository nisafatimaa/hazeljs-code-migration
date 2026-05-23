export interface MigrationOptions {
  sourcePath: string;
  sourceFramework: string;
  targetFramework: string;
  outputPath: string;
  dryRun: boolean;
}

export interface MigrationResult {
  success: boolean;
  filesProcessed: number;
  filesMigrated: number;
  errors: string[];
  warnings: string[];
  error?: string;
  reviewPrompt?: string;
}

export interface AnalysisResult {
  detectedFramework: string;
  filesAnalyzed: number;
  linesOfCode: number;
  suggestedMigrations: SuggestedMigration[];
  analysisPrompt?: string;
}

export interface SuggestedMigration {
  source: string;
  target: string;
  confidence: number;
  effort: string;
}

export interface CodeFile {
  path: string;
  content: string;
  language: string;
}

export interface MigrationRule {
  pattern: RegExp | string;
  replacement: string | ((match: string) => string);
  description: string;
}
