import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';

export class CodeAnalyzer {
  async detectFramework(sourcePath: string): Promise<string> {
    const files = this.getFiles(sourcePath);
    
    // Check for Express patterns
    const expressPatterns = [
      /require\(['"]express['"]\)/,
      /import.*express.*from/,
      /app\.get\(/,
      /app\.post\(/,
      /app\.use\(/,
      /router\./,
    ];

    // Check for React patterns
    const reactPatterns = [
      /import.*React.*from/,
      /import.*\{.*useState.*\}.*from.*react/,
      /import.*\{.*useEffect.*\}.*from.*react/,
      /<div/,
      /className=/,
      /export default function/,
    ];

    // Check for Angular patterns
    const angularPatterns = [
      /@Component/,
      /@NgModule/,
      /@Injectable/,
      /from '@angular/,
    ];

    // Check for Vue patterns
    const vuePatterns = [
      /from ['"]vue['"]/,
      /<template/,
      /<script/,
      /Vue\.component/,
      /new Vue\(/,
    ];

    // Check for Fastify patterns
    const fastifyPatterns = [
      /require\(['"]fastify['"]\)/,
      /import.*fastify.*from/,
      /fastify\.get\(/,
      /fastify\.post\(/,
      /fastify\.register\(/,
    ];

    const scores: { [key: string]: number } = {
      express: 0,
      react: 0,
      angular: 0,
      vue: 0,
      vue2: 0,
      fastify: 0,
    };

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      
      for (const pattern of expressPatterns) {
        if (pattern.test(content)) scores.express++;
      }
      
      for (const pattern of reactPatterns) {
        if (pattern.test(content)) scores.react++;
      }
      
      for (const pattern of angularPatterns) {
        if (pattern.test(content)) scores.angular++;
      }
      
      for (const pattern of vuePatterns) {
        if (pattern.test(content)) scores.vue++;
      }
      
      for (const pattern of fastifyPatterns) {
        if (pattern.test(content)) scores.fastify++;
      }

      // Check for Vue 2 specific patterns
      if (/new Vue\(/.test(content) || /Vue\.component/.test(content)) {
        scores.vue2++;
      }
    }

    // Find the framework with the highest score
    let maxScore = 0;
    let detectedFramework = 'unknown';

    for (const [framework, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        detectedFramework = framework;
      }
    }

    return detectedFramework;
  }

  private getFiles(sourcePath: string): string[] {
    const files: string[] = [];
    const extensions = ['.js', '.jsx', '.ts', '.tsx', '.vue', '.json'];

    const scanDirectory = (dir: string) => {
      try {
        const items = fs.readdirSync(dir);

        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
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
      } catch (error) {
        // Skip directories we can't read
      }
    };

    if (fs.statSync(sourcePath).isDirectory()) {
      scanDirectory(sourcePath);
    } else {
      files.push(sourcePath);
    }

    return files;
  }
}
