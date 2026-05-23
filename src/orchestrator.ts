import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';
import { MigrationOptions, MigrationResult, AnalysisResult } from './types';
import { CodeAnalyzer } from './agents/code-analyzer';
import { FrameworkTransformer } from './transformers/framework-transformer';
import {
  MIGRATION_ANALYSIS_PROMPT_KEY,
  MIGRATION_REVIEW_PROMPT_KEY,
  renderPrompt,
} from './prompts';

export class CodeMigrationOrchestrator {
  private analyzer: CodeAnalyzer;
  private transformer: FrameworkTransformer;

  constructor() {
    this.analyzer = new CodeAnalyzer();
    this.transformer = new FrameworkTransformer();
  }

  async migrate(options: MigrationOptions): Promise<MigrationResult> {
    const normalizedOptions = this.normalizeOptions(options);
    const result: MigrationResult = {
      success: false,
      filesProcessed: 0,
      filesMigrated: 0,
      errors: [],
      warnings: [],
    };

    try {
      const files = this.getFilesToProcess(normalizedOptions.sourcePath);
      result.filesProcessed = files.length;

      if (files.length === 0) {
        result.errors.push('No files found to process');
        return result;
      }

      for (const file of files) {
        try {
          const content = fs.readFileSync(file, 'utf-8');
          const migratedContent = await this.transformer.transform(
            content,
            normalizedOptions.sourceFramework,
            normalizedOptions.targetFramework,
            file
          );

          if (migratedContent !== content) {
            if (!normalizedOptions.dryRun) {
              const relativePath = path.relative(normalizedOptions.sourcePath, file);
              const outputPath = path.join(normalizedOptions.outputPath, relativePath);
              const outputDir = path.dirname(outputPath);

              // Create output directory if it doesn't exist
              if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
              }

              fs.writeFileSync(outputPath, migratedContent, 'utf-8');
            }
            result.filesMigrated++;
          }
        } catch (error) {
          result.errors.push(`Error processing ${file}: ${this.formatError(error)}`);
        }
      }

      if (result.filesMigrated === 0) {
        result.warnings.push(
          `No files changed for ${normalizedOptions.sourceFramework} to ${normalizedOptions.targetFramework}`
        );
      }

      result.success = result.errors.length === 0;
      result.reviewPrompt = renderPrompt(MIGRATION_REVIEW_PROMPT_KEY, {
        targetFramework: normalizedOptions.targetFramework,
        migratedFiles: result.filesMigrated,
        warnings: result.warnings.join('\n'),
      });
    } catch (error) {
      result.error = `Migration failed: ${this.formatError(error)}`;
    }

    return result;
  }

  async analyze(sourcePath: string): Promise<AnalysisResult> {
    const result: AnalysisResult = {
      detectedFramework: 'unknown',
      filesAnalyzed: 0,
      linesOfCode: 0,
      suggestedMigrations: [],
    };

    try {
      const files = this.getFilesToProcess(sourcePath);
      result.filesAnalyzed = files.length;

      // Analyze each file
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');
        result.linesOfCode += content.split('\n').length;
      }

      // Detect framework
      result.detectedFramework = await this.analyzer.detectFramework(sourcePath);

      // Suggest migrations based on detected framework
      result.suggestedMigrations = this.getSuggestedMigrations(result.detectedFramework);
      result.analysisPrompt = renderPrompt(MIGRATION_ANALYSIS_PROMPT_KEY, {
        sourcePath,
        detectedFramework: result.detectedFramework,
        filesAnalyzed: result.filesAnalyzed,
      });
    } catch (error) {
      console.error('Analysis failed:', error);
    }

    return result;
  }

  private getFilesToProcess(sourcePath: string): string[] {
    const files: string[] = [];
    const extensions = ['.js', '.jsx', '.ts', '.tsx', '.vue', '.svelte'];

    const scanDirectory = (dir: string) => {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          // Skip node_modules and other common exclusions
          if (!['node_modules', '.git', 'dist', 'build'].includes(item)) {
            scanDirectory(fullPath);
          }
        } else if (stat.isFile()) {
          const ext = path.extname(item);
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    };

    if (fs.statSync(sourcePath).isDirectory()) {
      scanDirectory(sourcePath);
    } else {
      files.push(sourcePath);
    }

    return files;
  }

  private normalizeOptions(options: MigrationOptions): MigrationOptions {
    return {
      ...options,
      outputPath: options.outputPath || './migrated',
      sourceFramework: options.sourceFramework.toLowerCase(),
      targetFramework: options.targetFramework.toLowerCase(),
    };
  }

  private formatError(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  private getSuggestedMigrations(detectedFramework: string): any[] {
    const migrations: any[] = [];

    switch (detectedFramework.toLowerCase()) {
      case 'express':
        migrations.push({
          source: 'Express',
          target: 'Fastify',
          confidence: 85,
          effort: 'Medium',
        });
        migrations.push({
          source: 'Express',
          target: 'Hapi',
          confidence: 75,
          effort: 'Medium',
        });
        break;
      case 'react':
        migrations.push({
          source: 'React',
          target: 'Vue',
          confidence: 80,
          effort: 'High',
        });
        migrations.push({
          source: 'React',
          target: 'Svelte',
          confidence: 70,
          effort: 'High',
        });
        break;
      case 'angular':
        migrations.push({
          source: 'Angular',
          target: 'React',
          confidence: 65,
          effort: 'Very High',
        });
        break;
      case 'vue2':
        migrations.push({
          source: 'Vue 2',
          target: 'Vue 3',
          confidence: 90,
          effort: 'Medium',
        });
        break;
    }

    return migrations;
  }
}
