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
  if (match) {
    return match[1];
  }
  return null;
}

/**
 * Checks if a target path inside another module corresponds to an approved public surface
 */
function isApprovedCrossModulePublicSurface(targetModule, resolvedPath) {
  const normalized = resolvedPath.replace(/\\/g, '/');
  const publicSurfacePatterns = [
    `/src/modules/${targetModule}/application/contracts`,
    `/src/modules/${targetModule}/application/interfaces`,
    `/src/modules/${targetModule}/domain/interfaces`,
  ];

  return publicSurfacePatterns.some((pattern) => normalized.includes(pattern));
}

/**
 * Scans src/modules/ directory to ensure only the six approved Phase-1 modules exist
 */
function checkUnapprovedModules(modulesDir) {
  const violations = [];
  if (!fs.existsSync(modulesDir)) return violations;

  const entries = fs.readdirSync(modulesDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!APPROVED_MODULES.includes(entry.name)) {
        violations.push(
          `Unapproved module detected: ${entry.name}. ADR-001 allows only: ${APPROVED_MODULES.join(', ')}`
        );
      }
    }
  }

  return violations;
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
        if (DB_DRIVERS.includes(importSpecifier) || resolvedPath.includes('/src/db')) {
          fileViolations.push(
            `Direct DB access '${importSpecifier}' forbidden in presentation layer (${path.relative(process.cwd(), filePath)})`
          );
        }
      }

      // Rule 2: Database / Schema infrastructure must NOT import presentation code
      const isInfrastructureFile =
        normalizedFilePath.includes('/src/db') || normalizedFilePath.includes('/infrastructure/');

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

      // Rule 3: Strict Cross-module import policy (DEFAULT-DENY)
      if (fileModule && APPROVED_MODULES.includes(fileModule)) {
        const targetModule = getModuleName(resolvedPath);
        if (targetModule && targetModule !== fileModule) {
          if (!APPROVED_MODULES.includes(targetModule)) {
            fileViolations.push(
              `Cross-module import targeting unapproved module '${targetModule}' (${path.relative(process.cwd(), filePath)})`
            );
          } else {
            // Must target an approved cross-module public surface
            if (!isApprovedCrossModulePublicSurface(targetModule, resolvedPath)) {
              fileViolations.push(
                `Forbidden cross-module import: ${fileModule} -> ${targetModule} (${path.relative(process.cwd(), filePath)} imports '${importSpecifier}'). ADR-001 allows cross-module imports only from application/contracts, application/interfaces, or domain/interfaces.`
              );
            }
          }
        }
      }

      // Rule 4: Domain, Application, and Presentation layers in modules must NOT import DB infrastructure
      const isNonInfraModuleFile =
        normalizedFilePath.includes('/domain/') ||
        normalizedFilePath.includes('/application/') ||
        normalizedFilePath.includes('/presentation/');

      if (isNonInfraModuleFile) {
        if (DB_DRIVERS.includes(importSpecifier) || resolvedPath.includes('/src/db')) {
          fileViolations.push(
            `Direct DB/ORM infrastructure access '${importSpecifier}' forbidden in domain/application/presentation layer (${path.relative(process.cwd(), filePath)})`
          );
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
  const modulesDir = path.join(srcDir, 'modules');

  // 1. Enforce six-module directory limit
  violations.push(...checkUnapprovedModules(modulesDir));

  // 2. Scan all source code files
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

  console.log(
    '✅ PASS: Architecture boundary rules satisfied (ADR-001 enforced via AST parsing & DEFAULT-DENY).'
  );
}

/**
 * Real Self-Test Mode with temporary negative and positive AST source fixtures
 */
function runSelfTest() {
  console.log('🧪 Running Architecture Gate Self-Test with AST fixtures...');

  const testCases = [
    {
      name: 'Fixture A: UI -> Direct DB import',
      path: path.join(process.cwd(), 'src', 'components', 'BadUi.tsx'),
      content: `import { pgTable } from 'drizzle-orm'; export const test = 1;`,
      shouldFail: true,
    },
    {
      name: 'Fixture B: posts -> projects/infrastructure/repository',
      path: path.join(process.cwd(), 'src', 'modules', 'posts', 'application', 'bad_infra.ts'),
      content: `import { repo } from '@/modules/projects/infrastructure/project.repository';`,
      shouldFail: true,
    },
    {
      name: 'Fixture C: posts -> projects/presentation/view',
      path: path.join(process.cwd(), 'src', 'modules', 'posts', 'application', 'bad_pres.ts'),
      content: `import { ProjectCard } from '@/modules/projects/presentation/project-card';`,
      shouldFail: true,
    },
    {
      name: 'Fixture D: posts -> projects/application/internal-use-case',
      path: path.join(
        process.cwd(),
        'src',
        'modules',
        'posts',
        'application',
        'bad_app_internal.ts'
      ),
      content: `import { createProject } from '@/modules/projects/application/create-project';`,
      shouldFail: true,
    },
    {
      name: 'Fixture E: posts -> projects/domain/entities/project',
      path: path.join(
        process.cwd(),
        'src',
        'modules',
        'posts',
        'application',
        'bad_dom_internal.ts'
      ),
      content: `import { ProjectEntity } from '@/modules/projects/domain/entities/project';`,
      shouldFail: true,
    },
    {
      name: 'Fixture F: unapproved module src/modules/payments',
      checkUnapprovedModule: 'payments',
      shouldFail: true,
    },
    {
      name: 'Fixture G: posts -> projects/application/contracts/project-reader',
      path: path.join(process.cwd(), 'src', 'modules', 'posts', 'application', 'good_contract.ts'),
      content: `import { ProjectReader } from '@/modules/projects/application/contracts/project-reader';`,
      shouldFail: false,
    },
    {
      name: 'Fixture H: posts -> projects/application/interfaces/project-query',
      path: path.join(
        process.cwd(),
        'src',
        'modules',
        'posts',
        'application',
        'good_app_interface.ts'
      ),
      content: `import { ProjectQuery } from '@/modules/projects/application/interfaces/project-query';`,
      shouldFail: false,
    },
    {
      name: 'Fixture I: posts -> projects/domain/interfaces/project-reference',
      path: path.join(
        process.cwd(),
        'src',
        'modules',
        'posts',
        'application',
        'good_dom_interface.ts'
      ),
      content: `import { ProjectReference } from '@/modules/projects/domain/interfaces/project-reference';`,
      shouldFail: false,
    },
    {
      name: 'Fixture J: Application -> Direct DB import (NEGATIVE)',
      path: path.join(process.cwd(), 'src', 'modules', 'auth', 'application', 'bad_app_db.ts'),
      content: `import { db } from '../../../db';`,
      shouldFail: true,
    },
    {
      name: 'Fixture K: Domain -> Direct DB import (NEGATIVE)',
      path: path.join(process.cwd(), 'src', 'modules', 'auth', 'domain', 'bad_dom_db.ts'),
      content: `import { user } from '../../../db/schema';`,
      shouldFail: true,
    },
    {
      name: 'Fixture L: Presentation -> Direct DB import (NEGATIVE)',
      path: path.join(process.cwd(), 'src', 'modules', 'auth', 'presentation', 'bad_pres_db.ts'),
      content: `import { db } from '../../../db';`,
      shouldFail: true,
    },
    {
      name: 'Fixture M: Infrastructure -> Direct DB import (POSITIVE)',
      path: path.join(
        process.cwd(),
        'src',
        'modules',
        'auth',
        'infrastructure',
        'good_infra_db.ts'
      ),
      content: `import { db } from '../../../db';`,
      shouldFail: false,
    },
  ];

  let passedAllSelfTests = true;

  for (const tc of testCases) {
    if (tc.checkUnapprovedModule) {
      const dummyUnapprovedDir = path.join(
        process.cwd(),
        'src',
        'modules',
        tc.checkUnapprovedModule
      );
      fs.mkdirSync(dummyUnapprovedDir, { recursive: true });

      const violations = checkUnapprovedModules(path.join(process.cwd(), 'src', 'modules'));
      fs.rmdirSync(dummyUnapprovedDir);

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
        console.log(
          `  ✓ ${tc.name}: ${tc.shouldFail ? 'Correctly Rejected' : 'Correctly Accepted'}`
        );
      }
      continue;
    }

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

  if (!passedAllSelfTests) {
    console.error('❌ Architecture Self-Test FAILED.');
    process.exit(1);
  }

  console.log(
    '✅ Architecture Gate Self-Test PASSED (All 13 AST negative/positive fixtures verified).'
  );
  process.exit(0);
}

// Execution switch
if (process.argv.includes('--self-test')) {
  runSelfTest();
} else {
  runRepositoryScan();
}
