/**
 * Task 1 - build this.
 *
 * Walk every .ts file under src/modules and look at its imports.
 * A module may import:
 *   - its own files
 *   - anything under src/platform
 *   - another module's index.ts  -  and nothing else
 *
 * Anything else is a violation.
 *
 * Running this file directly should print the violations and exit 1 when
 * there are any, 0 when there are none.
 *
 * No dependencies. node:fs and node:path are enough. Remember that a
 * type-only import still couples one module to another.
 */


import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export interface Violation {
  file: string;
  importPath: string;
  reason: string;
}

export function findViolations(root: string): Violation[] {
  const modulesPath = path.join(root, "modules");
  const violations: Violation[] = [];

  // Find all TypeScript files inside modules.
  function scanFolder(folder: string): string[] {
    const entries = readdirSync(folder, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
      const fullPath = path.join(folder, entry.name);

      if (entry.isDirectory()) {
        files.push(...scanFolder(fullPath));
      } else if (entry.isFile() && entry.name.endsWith(".ts")) {
        files.push(fullPath);
      }
    }

    return files;
  }

  const files = scanFolder(modulesPath);

  // Read each file and find its imports.
  for (const file of files) {
    const source = readFileSync(file, "utf8");

    const importPattern =
      /\b(?:import|export)\s+(?:type\s+)?(?:[^"'`]*?\s+from\s*)?["']([^"']+)["']/g;

    for (const match of source.matchAll(importPattern)) {
      const importPath = match[1];
      if (!importPath) continue;

      // Package imports do not cross our local module boundaries.
      if (!importPath.startsWith(".")) continue;

      const target = path.resolve(path.dirname(file), importPath);
      const relativeTarget = path.relative(root, target);
      const parts = relativeTarget.split(path.sep);

      const currentFile = path.relative(root, file);
      const currentParts = currentFile.split(path.sep);
      const currentModule = currentParts[1];

      const isPlatform = parts[0] === "platform";
      const isOwnModule =
        parts[0] === "modules" && parts[1] === currentModule;
      const isPublicApi =
        parts[0] === "modules" &&
        parts[1] !== currentModule &&
        parts.length === 3 &&
        parts[2] === "index.ts";

      if (!isPlatform && !isOwnModule && !isPublicApi) {
        violations.push({
          file: currentFile,
          importPath,
          reason: "Cross-module import bypasses index.ts",
        });
      }
    }
  }

  return violations;
}

// Run the checker when this file is executed directly.
const currentFile = fileURLToPath(import.meta.url);
const executedFile = process.argv[1]
  ? path.resolve(process.argv[1])
  : "";

if (currentFile === executedFile) {
  const root = path.resolve("src");
  const violations = findViolations(root);

  if (violations.length > 0) {
    console.error(violations);
    process.exitCode = 1;
  } else {
    console.log("No module boundary violations found.");
    process.exitCode = 0;
  }
}
