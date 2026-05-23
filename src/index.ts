import 'reflect-metadata';
import { Agent, Tool } from '@hazeljs/agent';
import { MemoryService, InMemoryStore, MemoryCategory } from '@hazeljs/memory';
import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import * as fs from 'fs';
import { CodeMigrationOrchestrator } from './orchestrator';
import { MigrationOptions } from './types';

// Initialize HazelJS services
const memoryStore = new InMemoryStore();
const memoryService = new MemoryService(memoryStore);

@Agent({
  name: 'code-migration-agent',
  description: 'AI-powered code migration agent that analyzes and transforms code between frameworks',
  systemPrompt: 'You are an expert code migration assistant. Analyze codebases, detect frameworks, and transform code between different frameworks while preserving functionality.',
  enableMemory: true,
})
class CodeMigrationAgent {
  private orchestrator: CodeMigrationOrchestrator;

  constructor() {
    this.orchestrator = new CodeMigrationOrchestrator();
  }

  @Tool({
    name: 'analyze_codebase',
    description: 'Analyze a codebase to detect the framework and suggest migrations',
  })
  async analyzeCodebase(sourcePath: string) {
    const result = await this.orchestrator.analyze(sourcePath);
    
    // Store analysis in memory using public API
    await memoryService.save({
      category: MemoryCategory.EPISODIC,
      key: `analysis:${sourcePath}`,
      value: {
        sourcePath,
        result,
        timestamp: new Date(),
      },
      userId: 'cli-user',
      confidence: 1.0,
      source: 'explicit',
      evidence: [],
    });
    
    return result;
  }

  @Tool({
    name: 'migrate_code',
    description: 'Migrate code from one framework to another',
  })
  async migrateCode(options: MigrationOptions) {
    const result = await this.orchestrator.migrate(options);
    
    // Store migration in memory using public API
    await memoryService.save({
      category: MemoryCategory.EPISODIC,
      key: `migration:${options.sourcePath}:${options.targetFramework}`,
      value: {
        options,
        result,
        timestamp: new Date(),
      },
      userId: 'cli-user',
      confidence: 1.0,
      source: 'explicit',
      evidence: [],
    });
    
    return result;
  }
}

const agent = new CodeMigrationAgent();

const program = new Command();

program
  .name('hazel-migrate')
  .description('AI-Powered Code Migration Assistant using HazelJS')
  .version('1.0.0');

program
  .command('migrate')
  .description('Migrate code from one framework to another')
  .option('-s, --source <path>', 'Source code directory or file')
  .option('-t, --target <framework>', 'Target framework (fastify, vue, etc.)')
  .option('-o, --output <path>', 'Output directory for migrated code')
  .option('-f, --framework <framework>', 'Source framework (express, react, etc.)')
  .option('--dry-run', 'Preview changes without writing files')
  .action(async (options) => {
    await runMigration(options);
  });

program
  .command('analyze')
  .description('Analyze codebase and suggest migrations')
  .option('-s, --source <path>', 'Source code directory or file')
  .action(async (options) => {
    await analyzeCodebase(options);
  });

program
  .command('list')
  .description('List supported migration paths')
  .action(async () => {
    await listMigrations();
  });

async function runMigration(options: any) {
  const spinner = ora('Initializing migration...').start();

  try {
    // Interactive mode if options are missing
    let migrationOptions: MigrationOptions = {
      sourcePath: options.source,
      targetFramework: options.target,
      outputPath: options.output,
      sourceFramework: options.framework,
      dryRun: options.dryRun || false,
    };

    if (!migrationOptions.outputPath) {
      migrationOptions.outputPath = './migrated';
    }

    if (!migrationOptions.sourcePath || !migrationOptions.targetFramework || !migrationOptions.sourceFramework) {
      spinner.stop();
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'sourcePath',
          message: 'Enter source code path:',
          when: !migrationOptions.sourcePath,
          validate: (input: string) => fs.existsSync(input) || 'Path does not exist',
        },
        {
          type: 'list',
          name: 'sourceFramework',
          message: 'Select source framework:',
          choices: ['express', 'react', 'angular', 'vue2'],
          when: !migrationOptions.sourceFramework,
        },
        {
          type: 'list',
          name: 'targetFramework',
          message: 'Select target framework:',
          choices: ['fastify', 'vue', 'svelte', 'nuxt'],
          when: !migrationOptions.targetFramework,
        },
        {
          type: 'input',
          name: 'outputPath',
          message: 'Enter output path:',
          default: './migrated',
          when: !migrationOptions.outputPath,
        },
        {
          type: 'confirm',
          name: 'dryRun',
          message: 'Preview changes without writing files?',
          default: false,
          when: !migrationOptions.dryRun,
        },
      ]);

      migrationOptions = { ...migrationOptions, ...answers };
      spinner.start('Initializing migration...');
    }

    // Validate source path
    if (!fs.existsSync(migrationOptions.sourcePath)) {
      spinner.fail(chalk.red('Source path does not exist'));
      process.exit(1);
    }

    spinner.text = 'Analyzing source code...';

    // Use HazelJS agent to perform migration
    const result = await agent.migrateCode(migrationOptions);

    spinner.stop();

    if (result.success) {
      console.log(chalk.green('\n✓ Migration completed successfully!'));
      console.log(chalk.blue(`\nFiles processed: ${result.filesProcessed}`));
      console.log(chalk.blue(`Files migrated: ${result.filesMigrated}`));
      console.log(chalk.blue(`Errors: ${result.errors.length}`));

      if (result.errors.length > 0) {
        console.log(chalk.yellow('\nErrors encountered:'));
        result.errors.forEach((error: string) => {
          console.log(chalk.red(`  - ${error}`));
        });
      }

      if (result.warnings.length > 0) {
        console.log(chalk.yellow('\nWarnings:'));
        result.warnings.forEach((warning: string) => {
          console.log(chalk.yellow(`  - ${warning}`));
        });
      }

      if (!migrationOptions.dryRun) {
        console.log(chalk.green(`\nMigrated code written to: ${migrationOptions.outputPath}`));
      } else {
        console.log(chalk.yellow('\nDry run completed. No files were modified.'));
      }
    } else {
      console.log(chalk.red('\n✗ Migration failed'));
      console.log(chalk.red(result.error || 'Unknown error'));
      process.exit(1);
    }
  } catch (error) {
    spinner.fail(chalk.red('Migration failed'));
    console.error(error);
    process.exit(1);
  }
}

async function analyzeCodebase(options: any) {
  const spinner = ora('Analyzing codebase...').start();

  try {
    let sourcePath = options.source;

    if (!sourcePath) {
      spinner.stop();
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'sourcePath',
          message: 'Enter codebase path to analyze:',
          validate: (input: string) => fs.existsSync(input) || 'Path does not exist',
        },
      ]);
      sourcePath = answers.sourcePath;
      spinner.start('Analyzing codebase...');
    }

    if (!fs.existsSync(sourcePath)) {
      spinner.fail(chalk.red('Path does not exist'));
      process.exit(1);
    }

    // Use HazelJS agent to perform analysis
    const analysis = await agent.analyzeCodebase(sourcePath);

    spinner.stop();

    console.log(chalk.green('\n✓ Analysis completed'));
    console.log(chalk.blue(`\nDetected framework: ${analysis.detectedFramework}`));
    console.log(chalk.blue(`Files analyzed: ${analysis.filesAnalyzed}`));
    console.log(chalk.blue(`Total lines of code: ${analysis.linesOfCode}`));

    if (analysis.suggestedMigrations.length > 0) {
      console.log(chalk.yellow('\nSuggested migrations:'));
      analysis.suggestedMigrations.forEach((migration: any) => {
        console.log(chalk.cyan(`  - ${migration.source} → ${migration.target}`));
        console.log(chalk.gray(`    Confidence: ${migration.confidence}%`));
        console.log(chalk.gray(`    Effort: ${migration.effort}`));
      });
    } else {
      console.log(chalk.yellow('\nNo suggested migrations found.'));
    }
  } catch (error) {
    spinner.fail(chalk.red('Analysis failed'));
    console.error(error);
    process.exit(1);
  }
}

async function listMigrations() {
  console.log(chalk.green('\nSupported Migration Paths:'));
  console.log(chalk.blue('\nBackend Frameworks:'));
  console.log(chalk.cyan('  - Express → Fastify'));
  console.log(chalk.cyan('  - Express → Hapi'));
  console.log(chalk.cyan('  - Koa → Fastify'));
  
  console.log(chalk.blue('\nFrontend Frameworks:'));
  console.log(chalk.cyan('  - React → Vue'));
  console.log(chalk.cyan('  - React → Svelte'));
  console.log(chalk.cyan('  - Angular → React'));
  console.log(chalk.cyan('  - Vue 2 → Vue 3'));
  
  console.log(chalk.blue('\nComing Soon:'));
  console.log(chalk.gray('  - TypeScript → JavaScript'));
  console.log(chalk.gray('  - JavaScript → TypeScript'));
  console.log(chalk.gray('  - Class Components → Hooks'));
  console.log(chalk.gray('  - Redux → Zustand'));
}

program.parse();
