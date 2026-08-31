import * as fs from 'fs';
import * as path from 'path';
import ts from 'typescript';

const APPROVED_MODULES = ['auth', 'posts', 'projects', 'media', 'contact', 'audit'];
const DB_DRIVERS = ['drizzle-orm', 'postgres', 'drizzle-kit', 'pg'];

/**
 * Resolves an import module specifier to an absolute or relative project path
 */
function resolveImportPath(importSpecifier, containingFilePath) {
  let resolved = importSpecifier;

  if (importSpecifier.startsWith('@/')) {
    resolved = path.join(process.cwd(), 'src', importSpecifier.slice(2));
  } else if (importSpecifier.startsWith('./') || importSpecifier.startsWith('../')) {
    const containingDir = path.dirname(containingFilePath);
    resolved = path.resolve(containingDir, importSpecifier);
  }

  return resolved.replace(/\\/g, '/');
}

/**
 * Extracts module name from a file path if it resides under src/modules/<module_name>/
 */
function getModuleName(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  const match = normalized.match(/\/src\/modules\/([^\/]+)/);
  if (match && APPROVED_MODULES.includes(match[1])) {
    return match[1];
  }
  return null;
}

/**
 * Parses AST of a TypeScript file and verifies ADR-001 import rules
 */
function analyzeFileImports(filePath, customContent = null) {
  const content = customContent !== null ? customContent : fs.readFileSync(filePath, 'utf-8');
  const normalizedFilePath = filePath.replace(/\\/g, '/');
  const fileModule = getModuleName(normalizedFilePath);
  const fileViolations = [];

  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true
  );

  function visit(node) {
    let importSpecifier = null;

    if (
      ts.isImportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      importSpecifier = node.moduleSpecifier.text;
    } else if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      importSpecifier = node.moduleSpecifier.text;
    } else if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === 'require')) &&
      node.arguments.length > 0 &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      importSpecifier = node.arguments[0].text;
    }

    if (importSpecifier) {
      const resolvedPath = resolveImportPath(importSpecifier, filePath);

      // Rule 1: UI / Presentation layer must NOT access DB drivers directly
      const isPresentationFile =
        normalizedFilePath.includes('/src/app/') ||
        normalizedFilePath.includes('/src/components/') ||
        normalizedFilePath.includes('/presentation/');

      if (isPresentationFile) {
        if (DB_DRIVERS.includes(importSpecifier) || resolvedPath.includes('/src/db/')) {
          fileViolations.push(
            `Direct DB access '${importSpecifier}' forbidden in presentation layer (${path.relative(process.cwd(), filePath)})`
          );
        }
      }

      // Rule 2: Database / Schema infrastructure must NOT import presentation code
      const isInfrastructureFile =
        normalizedFilePath.includes('/src/db/') || normalizedFilePath.includes('/infrastructure/');

      if (isInfrastructureFile) {
        if (
          resolvedPath.includes('/src/app/') ||
          resolvedPath.includes('/src/components/') ||
          resolvedPath.includes('/presentation/')
        ) {
          fileViolations.push(
            `Infrastructure code must not depend on presentation layer (${path.relative(process.cwd(), filePath)} -> ${importSpecifier})`
          );
        }
      }

      // Rule 3: Cross-module import restrictions for src/modules/
      if (fileModule) {
        const targetModule = getModuleName(resolvedPath);
        if (targetModule && targetModule !== fileModule) {
          // Rule 3a: Cross-module import of infrastructure is forbidden
          if (resolvedPath.includes(`/src/modules/${targetModule}/infrastructure`)) {
            fileViolations.push(
              `Cross-module infrastructure import forbidden: ${fileModule} -> ${targetModule}/infrastructure (${path.relative(process.cwd(), filePath)})`
            );
          }
          // Rule 3b: Cross-module import of presentation is forbidden
          if (resolvedPath.includes(`/src/modules/${targetModule}/presentation`)) {
            fileViolations.push(
              `Cross-module presentation import forbidden: ${fileModule} -> ${targetModule}/presentation (${path.relative(process.cwd(), filePath)})`
            );
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return fileViolations;
}

/**
 * Scans all TypeScript files under src/ recursively
 */
function runRepositoryScan() {
  console.log('🏗️ Running Architecture Boundary Verification Gate (ADR-001)...');
  const violations = [];
  const srcDir = path.join(process.cwd(), 'src');

  function scan(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scan(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        const v = analyzeFileImports(fullPath);
        violations.push(...v);
      }
    }
  }

  scan(srcDir);

  if (violations.length > 0) {
    console.error('❌ ARCHITECTURE BOUNDARY VIOLATION DETECTED!');
    violations.forEach((v) => console.error(` - ${v}`));
    process.exit(1);
  }

  console.log('✅ PASS: Architecture boundary rules satisfied (ADR-001 enforced via AST parsing).');
}

/**
 * Real Self-Test Mode with temporary negative and positive AST source fixtures
 */
function runSelfTest() {
  console.log('🧪 Running Architecture Gate Self-Test with AST fixtures...');

  const fixtureDir = path.join(process.cwd(), 'src', 'modules', 'temp_fixture_test');
  fs.mkdirSync(fixtureDir, { recursive: true });

  const testCases = [
    {
      name: 'Negative Test 1: UI -> Direct DB import',
      path: path.join(process.cwd(), 'src', 'components', 'BadUi.tsx'),
      content: `import { pgTable } from 'drizzle-orm'; export const test = 1;`,
      shouldFail: true,
    },
    {
      name: 'Negative Test 2: Cross-Module Infrastructure Import',
      path: path.join(process.cwd(), 'src', 'modules', 'posts', 'application', 'bad_infra.ts'),
      content: `import { repo } from '@/modules/projects/infrastructure/repo';`,
      shouldFail: true,
    },
    {
      name: 'Negative Test 3: Cross-Module Presentation Import',
      path: path.join(process.cwd(), 'src', 'modules', 'posts', 'application', 'bad_pres.ts'),
      content: `import { View } from '@/modules/projects/presentation/view';`,
      shouldFail: true,
    },
    {
      name: 'Positive Test 1: Approved Cross-Module Application Contract Import',
      path: path.join(process.cwd(), 'src', 'modules', 'posts', 'application', 'good_contract.ts'),
      content: `import { ProjectContract } from '@/modules/projects/application/contracts';`,
      shouldFail: false,
    },
  ];

  let passedAllSelfTests = true;

  for (const tc of testCases) {
    const parent = path.dirname(tc.path);
    fs.mkdirSync(parent, { recursive: true });
    fs.writeFileSync(tc.path, tc.content, 'utf-8');

    const violations = analyzeFileImports(tc.path);
    fs.unlinkSync(tc.path);

    const failed = violations.length > 0;
    if (tc.shouldFail && !failed) {
      console.error(`❌ Self-test FAILED: ${tc.name} expected violations but passed!`);
      passedAllSelfTests = false;
    } else if (!tc.shouldFail && failed) {
      console.error(
        `❌ Self-test FAILED: ${tc.name} expected pass but got violations:`,
        violations
      );
      passedAllSelfTests = false;
    } else {
      console.log(`  ✓ ${tc.name}: ${tc.shouldFail ? 'Correctly Rejected' : 'Correctly Accepted'}`);
    }
  }

  // Cleanup temporary fixture directory
  if (fs.existsSync(fixtureDir)) {
    fs.rmSync(fixtureDir, { recursive: true, force: true });
  }

  if (!passedAllSelfTests) {
    console.error('❌ Architecture Self-Test FAILED.');
    process.exit(1);
  }

  console.log(
    '✅ Architecture Gate Self-Test PASSED (Negative and Positive AST fixtures verified).'
  );
  process.exit(0);
}

// Execution switch
if (process.argv.includes('--self-test')) {
  runSelfTest();
} else {
  runRepositoryScan();
}
