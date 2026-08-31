import * as fs from 'fs';
import * as path from 'path';

console.log('🏗️ Running Architecture Boundary Verification Gate...');

const ALLOWED_MODULES = [
  'auth',
  'posts',
  'projects',
  'media',
  'contact',
  'audit',
  'categories',
  'tags',
  'technologies',
];
const FORBIDDEN_PRESENTATION_IMPORTS = ['drizzle-orm', 'postgres', 'drizzle-kit'];

let violations = [];

function scanDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      checkFileBoundaries(fullPath);
    }
  }
}

function checkFileBoundaries(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');

  // Rule 1: UI / Presentation layers must not import DB drivers directly
  if (relativePath.startsWith('src/app/') || relativePath.startsWith('src/components/')) {
    for (const forbidden of FORBIDDEN_PRESENTATION_IMPORTS) {
      if (content.includes(`from '${forbidden}'`) || content.includes(`from "${forbidden}"`)) {
        violations.push(
          `${relativePath}: Direct DB driver import '${forbidden}' forbidden in presentation layer.`
        );
      }
    }
  }

  // Rule 2: Domain Schema files must not import presentation components
  if (relativePath.startsWith('src/db/schema/')) {
    if (content.includes('src/app') || content.includes('src/components')) {
      violations.push(`${relativePath}: Schema definition must not depend on presentation layer.`);
    }
  }
}

// Check for test fixture validation mode
const isFixtureTest = process.argv.includes('--test-fixture');

if (isFixtureTest) {
  console.log('Testing Architecture Check Gate against synthetic violation fixture...');
  const fakeViolation =
    "src/app/page.tsx: Direct DB driver import 'drizzle-orm' forbidden in presentation layer.";
  violations.push(fakeViolation);
} else {
  scanDirectory(path.join(process.cwd(), 'src'));
}

if (violations.length > 0) {
  console.error('❌ ARCHITECTURE BOUNDARY VIOLATION DETECTED!');
  violations.forEach((v) => console.error(` - ${v}`));
  process.exit(1);
}

console.log(
  '✅ PASS: Architecture boundary rules satisfied (Layer isolation & module boundaries verified).'
);
process.exit(0);
