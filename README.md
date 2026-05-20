# HazelJS Code Migration Assistant

AI-Powered Code Migration Assistant using HazelJS - Automate framework transitions with intelligent code analysis and transformation.

## Features

- **Intelligent Code Analysis**: Automatically detect the framework used in your codebase
- **Framework Migration**: Support for migrating between popular frameworks
- **Dry Run Mode**: Preview changes before applying them
- **Interactive CLI**: User-friendly command-line interface with prompts
- **Detailed Reporting**: Get comprehensive reports on migration results

## Supported Migration Paths

### Backend Frameworks
- Express → Fastify
- Express → Hapi
- Koa → Fastify

### Frontend Frameworks
- React → Vue
- React → Svelte
- Angular → React
- Vue 2 → Vue 3

## Installation

```bash
npm install
```

## Usage

### Migrate Code

```bash
# Interactive mode
npm run dev migrate

# With options
npm run dev migrate -- --source ./my-express-app --target fastify --output ./migrated-app --framework express

# Dry run (preview changes)
npm run dev migrate -- --source ./my-express-app --target fastify --dry-run
```

### Analyze Codebase

```bash
# Analyze and detect framework
npm run dev analyze -- --source ./my-app

# Interactive mode
npm run dev analyze
```

### List Supported Migrations

```bash
npm run dev list
```

## Project Structure

```
hazeljs-code-migration/
├── src/
│   ├── agents/
│   │   └── code-analyzer.ts      # Code analysis agent
│   ├── transformers/
│   │   └── framework-transformer.ts  # Framework-specific transformations
│   ├── index.ts                   # CLI entry point
│   ├── orchestrator.ts            # Migration orchestration
│   └── types.ts                   # TypeScript type definitions
├── package.json
├── tsconfig.json
└── README.md
```

## How It Works

1. **Code Analysis**: The `CodeAnalyzer` agent scans your codebase to detect the framework and understand the code structure
2. **Framework Knowledge**: Specialized knowledge agents understand the patterns and APIs of different frameworks
3. **Transformation**: The `FrameworkTransformer` applies migration rules to convert code from one framework to another
4. **Orchestration**: The `CodeMigrationOrchestrator` coordinates the entire migration process

## Example: Express to Fastify Migration

### Before (Express)
```javascript
const express = require('express');
const app = express();

app.get('/users', (req, res) => {
  res.json({ users: [] });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### After (Fastify)
```javascript
const Fastify = require('fastify')({ logger: true });
const app = Fastify({ logger: true });

app.get('/users', async (request, reply) => {
  reply.send({ users: [] });
});

app.listen({ port: 3000 }, (err) => {
  if (err) throw err;
  app.log.info('Server running on port 3000');
});
```

## Development

### Build

```bash
npm run build
```

### Run

```bash
npm run dev
```

## Adding New Migration Rules

To add support for a new migration path, edit `src/transformers/framework-transformer.ts` and add rules to the appropriate method:

```typescript
private getYourMigrationRules(): MigrationRule[] {
  return [
    {
      pattern: /your-pattern/g,
      replacement: 'your-replacement',
      description: 'Description of the transformation',
    },
  ];
}
```

## Limitations

- Migration is not 100% automatic - some manual review and adjustment may be required
- Complex project structures may need additional configuration
- Some framework-specific features may not have direct equivalents

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Built with HazelJS

This project is built using the HazelJS framework, leveraging:
- `@hazeljs/agent` - Agent-based architecture
- `@hazeljs/inspector` - Code inspection capabilities
- `@hazeljs/prompts` - Prompt engineering
- `@hazeljs/memory` - Memory management
