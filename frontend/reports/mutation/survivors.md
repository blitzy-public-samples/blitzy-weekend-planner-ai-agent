# Surviving Mutants Report

> Generated from Stryker mutation testing baseline run (Directive 4)
> Source: `reports/mutation/mutation.json`

This report documents all surviving mutants extracted from the Stryker baseline mutation run.
Each surviving mutant represents a code mutation that was **not detected** (killed) by the
existing test suite — indicating a gap in test coverage or assertion strength.

These survivors are the direct input for **Directive 6** (targeted Vitest test generation).

---

## Baseline Summary

| Metric | Value |
|--------|-------|
| **Date** | *(populated after baseline run)* |
| **Stryker Version** | *(populated after baseline run)* |
| **Total Mutants** | *(populated after baseline run)* |
| **Killed** | *(populated after baseline run)* |
| **Survived** | *(populated after baseline run)* |
| **No Coverage** | *(populated after baseline run)* |
| **Timeout** | *(populated after baseline run)* |
| **Runtime Errors** | *(populated after baseline run)* |
| **Baseline Score** | *(populated after baseline run)* |

---

## Entry Format Specification

Each surviving mutant entry **MUST** contain **ALL FIVE** of the following fields.
No partial entries are permitted — every entry must include every field.

| # | Field | Description | Example |
|---|-------|-------------|---------|
| 1 | **File** | Relative file path from `frontend/src/` | `src/App.tsx` |
| 2 | **Location** | Line and column numbers | `Line 42, Column 15` |
| 3 | **Mutator** | Stryker mutator name | `ConditionalExpression` |
| 4 | **Original** | Original source code at mutation site | `x > 0` |
| 5 | **Mutated** | Mutated code that survived testing | `x >= 0` |

### Entry Template

```markdown
### Survivor #N

- **File:** `src/path/to/file.tsx`
- **Location:** Line XX, Column YY
- **Mutator:** MutatorName
- **Original:** `original code snippet here`
- **Mutated:** `mutated code snippet here`
```

---

## How to Populate This Report

This report is populated programmatically from `mutation.json` after executing the
Stryker baseline run. Follow these steps exactly:

1. **Run baseline mutation testing:**
   ```bash
   cd frontend && npm run test:mutation
   ```

2. **Verify `reports/mutation/mutation.json` was generated** — this is the machine-readable
   Stryker JSON report configured via `jsonReporter.fileName` in `stryker.config.json`.

3. **Parse `mutation.json` and extract all mutants where `status === "Survived"`.**

4. **For each surviving mutant, create an entry** with all five required fields using the
   entry template format above.

5. **Entry count must EXACTLY match the Survived count** from the Stryker mutation report.
   Do not omit, filter, or cherry-pick survivors — **ALL survivors must be included**.

### Extraction Script

The following Node.js script parses `mutation.json` and extracts all surviving mutants
into the required structured format:

```javascript
// extract-survivors.js — Run from frontend/ directory
// Usage: node extract-survivors.js

const fs = require('fs');
const path = require('path');

const REPORT_PATH = path.join(__dirname, 'reports', 'mutation', 'mutation.json');
const report = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf-8'));

const survivors = [];

if (report.files) {
  for (const [filePath, fileData] of Object.entries(report.files)) {
    for (const mutant of fileData.mutants) {
      if (mutant.status === 'Survived') {
        survivors.push({
          file: filePath,
          line: mutant.location.start.line,
          column: mutant.location.start.column,
          mutatorName: mutant.mutatorName,
          original: (() => {
            try {
              const srcLines = fileData.source.split('\n');
              const sl = mutant.location.start.line - 1;
              const sc = mutant.location.start.column - 1;
              const el = mutant.location.end.line - 1;
              const ec = mutant.location.end.column;
              if (sl === el) {
                return srcLines[sl].substring(sc, ec);
              }
              // Multi-line mutation: return first affected line from start column
              return srcLines[sl].substring(sc);
            } catch {
              return '(see source)';
            }
          })(),
          mutated: mutant.replacement || '(see mutation report)',
        });
      }
    }
  }
}

// Print summary
console.log(`Total surviving mutants: ${survivors.length}`);
console.log('');

// Print each survivor in Markdown format
survivors.forEach((s, idx) => {
  console.log(`### Survivor #${idx + 1}`);
  console.log('');
  console.log(`- **File:** \`${s.file}\``);
  console.log(`- **Location:** Line ${s.line}, Column ${s.column}`);
  console.log(`- **Mutator:** ${s.mutatorName}`);
  console.log(`- **Original:** \`${s.original}\``);
  console.log(`- **Mutated:** \`${s.mutated}\``);
  console.log('');
  console.log('---');
  console.log('');
});
```

### Stryker JSON Report Format Reference

The Stryker JSON reporter (`@stryker-mutator/core`) outputs a report structured as:

```json
{
  "schemaVersion": "1",
  "thresholds": { "high": 80, "low": 60 },
  "files": {
    "src/path/to/file.tsx": {
      "language": "typescript",
      "source": "...",
      "mutants": [
        {
          "id": "0",
          "mutatorName": "ConditionalExpression",
          "replacement": "false",
          "location": {
            "start": { "line": 42, "column": 15 },
            "end": { "line": 42, "column": 30 }
          },
          "status": "Survived",
          "description": "...",
          "statusReason": "..."
        }
      ]
    }
  }
}
```

Key fields for survivor extraction:
- `files[filePath].mutants[]` — array of all mutants for a given source file
- `mutant.status` — filter for `"Survived"` to identify surviving mutants
- `mutant.location.start.line` / `.column` — precise mutation location
- `mutant.mutatorName` — the type of mutation applied (e.g., `ArithmeticOperator`, `ConditionalExpression`, `StringLiteral`)
- `mutant.replacement` — the mutated code replacement string
- `mutant.description` — human-readable description of the mutation

---

## Mutation Target Files

The following source files are within the Stryker `mutate` scope (per `stryker.config.json`)
and are the files from which surviving mutants will originate:

| Source File | Lines | Statement Coverage | Expected Survivor Volume |
|-------------|-------|--------------------|--------------------------|
| `src/App.tsx` | 262 | 0% | **High** — state management, conditional rendering, callbacks with zero test coverage |
| `src/api/client.ts` | 382 | 0% (passing tests) | **High** — SSE parsing, error handling, API flow with zero coverage from passing tests |
| `src/components/InputForm.tsx` | 337 | 94.95% | **Low–Medium** — uncovered branches at ~79% (age validation boundary conditions) |
| `src/components/PlanView.tsx` | 408 | 92.89% | **Low–Medium** — uncovered branches at ~77% (regex parsing conditions, fallback paths) |
| `src/components/ErrorDisplay.tsx` | 250 | 100% | **Very Low** — near-complete coverage (~97% branches), minimal mutation gaps |
| `src/components/RawOutput.tsx` | 132 | 100% | **Very Low** — full statement coverage, possible boolean/string-literal mutants |
| `src/components/LoadingState.tsx` | 106 | 100% | **Very Low** — full statement coverage, possible structural mutants |
| `src/types.ts` | 310 | N/A | **Zero** — pure TypeScript interfaces with no runtime logic |

**Total mutable source:** 2,187 lines across 8 files (7 with runtime logic + 1 type-only).

### Files excluded from `mutate` scope:
- `src/__tests__/**` — test files
- `src/__mocks__/**` — mock files
- `src/main.tsx` — application entry point
- `src/**/*.d.ts` — TypeScript declaration files

---

## Survivors

> **Total Surviving Mutants:** *(populated after baseline run)*
>
> Each entry below corresponds to a mutant that survived the baseline test suite.
> These survivors are the targets for **Directive 6** (targeted test generation).
>
> **IMPORTANT:** ALL survivors from `mutation.json` must be listed below — no cherry-picking
> or filtering is permitted. The entry count must **EXACTLY** match the Survived count
> reported by Stryker.

### Survivor #1

- **File:** `src/example/file.tsx`
- **Location:** Line XX, Column YY
- **Mutator:** ExampleMutator
- **Original:** `original code here`
- **Mutated:** `mutated code here`

---

### Survivor #2

- **File:** `src/example/file.tsx`
- **Location:** Line XX, Column YY
- **Mutator:** ExampleMutator
- **Original:** `original code here`
- **Mutated:** `mutated code here`

---

*(Additional survivor entries to be populated from `mutation.json` after the Stryker baseline run — Directive 4)*

*(Each entry above is a **template placeholder**. After the baseline mutation run, replace these templates with actual surviving mutant data extracted from `reports/mutation/mutation.json`. Ensure every entry contains all five required fields and the total count matches the Survived metric exactly.)*

---

## Completeness Checklist

Before considering this report complete, verify:

- [ ] Entry count **exactly matches** the Survived count from `mutation.json`
- [ ] **Every** entry contains all 5 required fields (File, Location, Mutator, Original, Mutated)
- [ ] **No partial entries** — no fields are missing or contain only placeholders
- [ ] **No cherry-picking** — ALL survivors from `mutation.json` are included
- [ ] Baseline Summary table is filled with actual values from the Stryker run
- [ ] File paths are relative to `frontend/src/` (e.g., `src/App.tsx`, not absolute paths)
- [ ] Mutator names match Stryker's naming convention exactly
- [ ] Original and Mutated code snippets are accurate per the JSON report data
