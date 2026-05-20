import 'reflect-metadata';
import { MigrationRule } from '../types';

export class FrameworkTransformer {
  private migrationRules: { [key: string]: MigrationRule[] } = {
    'express-to-fastify': this.getExpressToFastifyRules(),
    'react-to-vue': this.getReactToVueRules(),
    'vue2-to-vue3': this.getVue2ToVue3Rules(),
  };

  async transform(
    content: string,
    sourceFramework: string,
    targetFramework: string,
    filePath: string
  ): Promise<string> {
    const migrationKey = `${sourceFramework}-to-${targetFramework}`;
    const rules = this.migrationRules[migrationKey];

    if (!rules) {
      return content;
    }

    let transformedContent = content;

    for (const rule of rules) {
      if (typeof rule.pattern === 'string') {
        const pattern = new RegExp(rule.pattern, 'g');
        if (typeof rule.replacement === 'function') {
          transformedContent = transformedContent.replace(pattern, rule.replacement);
        } else {
          transformedContent = transformedContent.replace(pattern, rule.replacement);
        }
      } else {
        if (typeof rule.replacement === 'function') {
          transformedContent = transformedContent.replace(rule.pattern, rule.replacement);
        } else {
          transformedContent = transformedContent.replace(rule.pattern, rule.replacement);
        }
      }
    }

    return transformedContent;
  }

  private getExpressToFastifyRules(): MigrationRule[] {
    return [
      {
        pattern: /require\(['"]express['"]\)/g,
        replacement: "require('fastify')({ logger: true })",
        description: 'Replace Express import with Fastify',
      },
      {
        pattern: /import.*express.*from.*['"]express['"]/g,
        replacement: "import Fastify from 'fastify'",
        description: 'Replace Express ES6 import with Fastify',
      },
      {
        pattern: /const app = express\(\)/g,
        replacement: "const app = Fastify({ logger: true })",
        description: 'Replace Express app initialization with Fastify',
      },
      {
        pattern: /app\.use\(([^)]+)\)/g,
        replacement: '// TODO: Convert Express middleware to Fastify hook\n// $1',
        description: 'Mark Express middleware for manual conversion',
      },
      {
        pattern: /app\.get\(['"`]([^'"`]+)['"`],\s*(async\s*)?\(([^)]+)\)\s*=>\s*\{/g,
        replacement: 'app.get(\'$1\', async (request, reply) => {',
        description: 'Convert Express GET route to Fastify',
      },
      {
        pattern: /app\.post\(['"`]([^'"`]+)['"`],\s*(async\s*)?\(([^)]+)\)\s*=>\s*\{/g,
        replacement: 'app.post(\'$1\', async (request, reply) => {',
        description: 'Convert Express POST route to Fastify',
      },
      {
        pattern: /app\.put\(['"`]([^'"`]+)['"`],\s*(async\s*)?\(([^)]+)\)\s*=>\s*\{/g,
        replacement: 'app.put(\'$1\', async (request, reply) => {',
        description: 'Convert Express PUT route to Fastify',
      },
      {
        pattern: /app\.delete\(['"`]([^'"`]+)['"`],\s*(async\s*)?\(([^)]+)\)\s*=>\s*\{/g,
        replacement: 'app.delete(\'$1\', async (request, reply) => {',
        description: 'Convert Express DELETE route to Fastify',
      },
      {
        pattern: /res\.status\((\d+)\)\.send\(([^)]+)\)/g,
        replacement: 'reply.code($1).send($2)',
        description: 'Convert Express response to Fastify reply',
      },
      {
        pattern: /res\.send\(([^)]+)\)/g,
        replacement: 'reply.send($1)',
        description: 'Convert Express res.send to Fastify reply.send',
      },
      {
        pattern: /res\.json\(([^)]+)\)/g,
        replacement: 'reply.send($1)',
        description: 'Convert Express res.json to Fastify reply.send',
      },
      {
        pattern: /req\.body/g,
        replacement: 'request.body',
        description: 'Convert Express req.body to Fastify request.body',
      },
      {
        pattern: /req\.params/g,
        replacement: 'request.params',
        description: 'Convert Express req.params to Fastify request.params',
      },
      {
        pattern: /req\.query/g,
        replacement: 'request.query',
        description: 'Convert Express req.query to Fastify request.query',
      },
      {
        pattern: /app\.listen\((\d+),\s*['"`]([^'"`]+)['"`],\s*\(\)\s*=>\s*\{/g,
        replacement: 'app.listen({ port: $1, host: \'$2\' }, (err) => {',
        description: 'Convert Express app.listen to Fastify app.listen',
      },
      {
        pattern: /app\.listen\((\d+),\s*\(\)\s*=>\s*\{/g,
        replacement: 'app.listen({ port: $1 }, (err) => {',
        description: 'Convert Express app.listen to Fastify app.listen',
      },
    ];
  }

  private getReactToVueRules(): MigrationRule[] {
    return [
      {
        pattern: /import React,\s*\{[^}]+\}\s*from\s*['"]react['"]/g,
        replacement: "import { ref, onMounted } from 'vue'",
        description: 'Replace React imports with Vue imports',
      },
      {
        pattern: /import\s*\{[^}]+\}\s*from\s*['"]react['"]/g,
        replacement: "import { ref, onMounted } from 'vue'",
        description: 'Replace React hooks with Vue composition API',
      },
      {
        pattern: /export default function ([^(]+)\(([^)]*)\)\s*\{/g,
        replacement: 'export default {\n  name: \'$1\',\n  setup($2) {',
        description: 'Convert React functional component to Vue component',
      },
      {
        pattern: /export default const ([^(]+)\s*=\s*\(([^)]*)\)\s*=>\s*\{/g,
        replacement: 'export default {\n  name: \'$1\',\n  setup($2) {',
        description: 'Convert React arrow function component to Vue component',
      },
      {
        pattern: /const\s+(\w+)\s*=\s*useState\(([^)]*)\)/g,
        replacement: 'const $1 = ref($2)',
        description: 'Convert React useState to Vue ref',
      },
      {
        pattern: /const\s+\[([^,]+),\s*set[^]]+\]\s*=\s*useState\(([^)]*)\)/g,
        replacement: 'const $1 = ref($2)',
        description: 'Convert React useState array to Vue ref',
      },
      {
        pattern: /useEffect\(\(\)\s*=>\s*\{/g,
        replacement: 'onMounted(() => {',
        description: 'Convert React useEffect to Vue onMounted',
      },
      {
        pattern: /useEffect\(\(\)\s*=>\s*\{([^}]+)\},\s*\[\]\)/g,
        replacement: 'onMounted(() => {$1})',
        description: 'Convert React useEffect with empty deps to Vue onMounted',
      },
      {
        pattern: /className=/g,
        replacement: 'class=',
        description: 'Convert React className to Vue class',
      },
      {
        pattern: /<div>/g,
        replacement: '<template><div>',
        description: 'Wrap JSX in template tag',
      },
      {
        pattern: /<\/div>/g,
        replacement: '</div></template>',
        description: 'Close template tag',
      },
      {
        pattern: /\{([^}]+)\}/g,
        replacement: '{{ $1 }}',
        description: 'Convert JSX expressions to Vue template syntax',
      },
      {
        pattern: /onChange=/g,
        replacement: '@change=',
        description: 'Convert React onChange to Vue @change',
      },
      {
        pattern: /onClick=/g,
        replacement: '@click=',
        description: 'Convert React onClick to Vue @click',
      },
      {
        pattern: /onSubmit=/g,
        replacement: '@submit=',
        description: 'Convert React onSubmit to Vue @submit',
      },
      {
        pattern: /return\s*\(/g,
        replacement: 'return {',
        description: 'Convert JSX return to Vue template return',
      },
      {
        pattern: /\);\s*\}\s*$/g,
        replacement: '};\n  }\n};',
        description: 'Close Vue component properly',
      },
    ];
  }

  private getVue2ToVue3Rules(): MigrationRule[] {
    return [
      {
        pattern: /new Vue\(\{/g,
        replacement: 'Vue.createApp({',
        description: 'Convert Vue 2 new Vue to Vue 3 createApp',
      },
      {
        pattern: /Vue\.component\(/g,
        replacement: 'app.component(',
        description: 'Convert Vue 2 component registration to Vue 3',
      },
      {
        pattern: /Vue\.directive\(/g,
        replacement: 'app.directive(',
        description: 'Convert Vue 2 directive registration to Vue 3',
      },
      {
        pattern: /Vue\.filter\(/g,
        replacement: '// Filters removed in Vue 3 - use computed properties or methods instead\n// Vue.filter(',
        description: 'Mark Vue 2 filters for migration',
      },
      {
        pattern: /v-model/g,
        replacement: 'v-model',
        description: 'v-model syntax changed in Vue 3',
      },
      {
        pattern: /\$listeners/g,
        replacement: '$attrs',
        description: '$listeners removed in Vue 3, use $attrs',
      },
      {
        pattern: /\$scopedSlots/g,
        replacement: '$slots',
        description: '$scopedSlots removed in Vue 3, use $slots',
      },
      {
        pattern: /\.sync/g,
        replacement: 'v-model:',
        description: '.sync modifier removed in Vue 3, use v-model:',
      },
      {
        pattern: /eventBus/g,
        replacement: '// TODO: Replace eventBus with mitt or similar library\n// eventBus',
        description: 'Event bus pattern changed in Vue 3',
      },
    ];
  }
}
