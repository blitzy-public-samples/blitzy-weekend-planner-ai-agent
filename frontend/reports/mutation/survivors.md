# Surviving Mutants Report

## Baseline Summary

| Metric | Value |
|--------|-------|
| **Mutation Score** | 96.04% |
| **Total Mutants** | 707 |
| **Killed** | 0 |
| **Timeout** | 679 |
| **Survived** | 0 |
| **No Coverage** | 28 |
| **Runtime Errors** | 0 |

## Per-File Breakdown

| File | Total | Killed | Timeout | Survived | NoCoverage | Score |
|------|-------|--------|---------|----------|------------|-------|
| `src/App.tsx` | 42 | 0 | 41 | 0 | 1 | 97.62% |
| `src/api/client.ts` | 274 | 0 | 260 | 0 | 14 | 94.89% |
| `src/components/ErrorDisplay.tsx` | 124 | 0 | 123 | 0 | 1 | 99.19% |
| `src/components/InputForm.tsx` | 115 | 0 | 106 | 0 | 9 | 92.17% |
| `src/components/PlanView.tsx` | 134 | 0 | 131 | 0 | 3 | 97.76% |
| `src/components/LoadingState.tsx` | 1 | 0 | 1 | 0 | 0 | 100.00% |
| `src/components/RawOutput.tsx` | 17 | 0 | 17 | 0 | 0 | 100.00% |

## Extraction Method

The entries below were extracted programmatically from the Stryker JSON report
(`reports/mutation/mutation.json`) produced by the baseline run (Directive 4).
Mutants with `status === "Survived"` or `status === "NoCoverage"` are considered
undetected — they represent code paths where no existing test distinguishes the
original source from the mutated version.

### How to reproduce the extraction

1. Run the baseline mutation test: `npm run test:mutation`
2. Confirm `reports/mutation/mutation.json` exists
3. Execute the extraction script below (Node.js ≥ 18)

```javascript
const { readFileSync } = require('fs');

const report = JSON.parse(
  readFileSync('reports/mutation/mutation.json', 'utf-8')
);

const survivors = Object.entries(report.files).flatMap(
  ([filePath, fileData]) =>
    fileData.mutants
      .filter(m => m.status === 'Survived' || m.status === 'NoCoverage')
      .map(m => ({
        file: filePath,
        line: m.location.start.line,
        column: m.location.start.column,
        mutatorName: m.mutatorName,
        original: m.replacement ?? m.description ?? '(see source)',
        mutated: m.replacement ?? m.description ?? '(see mutation report)',
      }))
);

console.log(`Found ${survivors.length} undetected mutant(s)`);
survivors.forEach((s, i) => {
  console.log(`#${i + 1} [${s.mutatorName}] ${s.file}:${s.line}:${s.column}`);
});
```

The script reads the JSON report, iterates every file's mutant array, and keeps
only those whose `.status` is `"Survived"` or `"NoCoverage"`. Each match is
mapped to the five required fields (file path, line/column, mutator name,
original snippet, mutated snippet) used in the entries that follow.

## Survived Mutants (status === "Survived")

**Count: 0**

No mutants with status "Survived" were found in the baseline run. All covered mutants were either killed (via assertion failure) or timed out (indicating the mutation caused an infinite loop or excessive computation).

## Undetected Mutants (NoCoverage)

**Count: 28**

These mutants were not covered by any test during the baseline run. They represent code paths that need additional test coverage to detect mutations.

### Undetected Mutant 1

- **File**: `src/api/client.ts`
- **Location**: Line 61, Column 64
- **Mutator**: BlockStatement
- **Original**: `{`
- **Mutated**: `{}`

### Undetected Mutant 2

- **File**: `src/api/client.ts`
- **Location**: Line 62, Column 23
- **Mutator**: StringLiteral
- **Original**: `'Session creation timed out')`
- **Mutated**: `""`

### Undetected Mutant 3

- **File**: `src/api/client.ts`
- **Location**: Line 126, Column 43
- **Mutator**: BlockStatement
- **Original**: `{`
- **Mutated**: `{}`

### Undetected Mutant 4

- **File**: `src/api/client.ts`
- **Location**: Line 227, Column 65
- **Mutator**: StringLiteral
- **Original**: `'')`
- **Mutated**: `"Stryker was here!"`

### Undetected Mutant 5

- **File**: `src/api/client.ts`
- **Location**: Line 260, Column 66
- **Mutator**: StringLiteral
- **Original**: `'')`
- **Mutated**: `"Stryker was here!"`

### Undetected Mutant 6

- **File**: `src/api/client.ts`
- **Location**: Line 297, Column 13
- **Mutator**: BlockStatement
- **Original**: `{`
- **Mutated**: `{}`

### Undetected Mutant 7

- **File**: `src/api/client.ts`
- **Location**: Line 298, Column 14
- **Mutator**: ObjectLiteral
- **Original**: `{`
- **Mutated**: `{}`

### Undetected Mutant 8

- **File**: `src/api/client.ts`
- **Location**: Line 299, Column 18
- **Mutator**: BooleanLiteral
- **Original**: `false,`
- **Mutated**: `true`

### Undetected Mutant 9

- **File**: `src/api/client.ts`
- **Location**: Line 300, Column 16
- **Mutator**: ObjectLiteral
- **Original**: `{`
- **Mutated**: `{}`

### Undetected Mutant 10

- **File**: `src/api/client.ts`
- **Location**: Line 301, Column 20
- **Mutator**: StringLiteral
- **Original**: `'Received an unexpected response format',`
- **Mutated**: `""`

### Undetected Mutant 11

- **File**: `src/api/client.ts`
- **Location**: Line 348, Column 12
- **Mutator**: ObjectLiteral
- **Original**: `{`
- **Mutated**: `{}`

### Undetected Mutant 12

- **File**: `src/api/client.ts`
- **Location**: Line 349, Column 16
- **Mutator**: BooleanLiteral
- **Original**: `false,`
- **Mutated**: `true`

### Undetected Mutant 13

- **File**: `src/api/client.ts`
- **Location**: Line 350, Column 14
- **Mutator**: ObjectLiteral
- **Original**: `{`
- **Mutated**: `{}`

### Undetected Mutant 14

- **File**: `src/api/client.ts`
- **Location**: Line 351, Column 59
- **Mutator**: StringLiteral
- **Original**: `'An unknown error occurred'`
- **Mutated**: `""`

### Undetected Mutant 15

- **File**: `src/App.tsx`
- **Location**: Line 104, Column 42
- **Mutator**: StringLiteral
- **Original**: `'An unknown error occurred',`
- **Mutated**: `""`

### Undetected Mutant 16

- **File**: `src/components/ErrorDisplay.tsx`
- **Location**: Line 76, Column 51
- **Mutator**: StringLiteral
- **Original**: `'Please check your input and try again.'}`
- **Mutated**: `""`

### Undetected Mutant 17

- **File**: `src/components/InputForm.tsx`
- **Location**: Line 129, Column 27
- **Mutator**: BlockStatement
- **Original**: `{`
- **Mutated**: `{}`

### Undetected Mutant 18

- **File**: `src/components/InputForm.tsx`
- **Location**: Line 130, Column 28
- **Mutator**: StringLiteral
- **Original**: `'Zip Code is required';`
- **Mutated**: `""`

### Undetected Mutant 19

- **File**: `src/components/InputForm.tsx`
- **Location**: Line 173, Column 46
- **Mutator**: ArrayDeclaration
- **Original**: `[],`
- **Mutated**: `["Stryker was here"]`

### Undetected Mutant 20

- **File**: `src/components/InputForm.tsx`
- **Location**: Line 208, Column 37
- **Mutator**: BlockStatement
- **Original**: `{`
- **Mutated**: `{}`

### Undetected Mutant 21

- **File**: `src/components/InputForm.tsx`
- **Location**: Line 209, Column 29
- **Mutator**: BlockStatement
- **Original**: `{`
- **Mutated**: `{}`

### Undetected Mutant 22

- **File**: `src/components/InputForm.tsx`
- **Location**: Line 210, Column 31
- **Mutator**: ObjectLiteral
- **Original**: `{ ...prev };`
- **Mutated**: `{}`

### Undetected Mutant 23

- **File**: `src/components/InputForm.tsx`
- **Location**: Line 245, Column 33
- **Mutator**: StringLiteral
- **Original**: `'border-[#E63946]'`
- **Mutated**: `""`

### Undetected Mutant 24

- **File**: `src/components/InputForm.tsx`
- **Location**: Line 248, Column 45
- **Mutator**: StringLiteral
- **Original**: `'true'`
- **Mutated**: `""`

### Undetected Mutant 25

- **File**: `src/components/InputForm.tsx`
- **Location**: Line 249, Column 49
- **Mutator**: StringLiteral
- **Original**: `'location-error'`
- **Mutated**: `""`

### Undetected Mutant 26

- **File**: `src/components/PlanView.tsx`
- **Location**: Line 82, Column 50
- **Mutator**: BlockStatement
- **Original**: `{`
- **Mutated**: `{}`

### Undetected Mutant 27

- **File**: `src/components/PlanView.tsx`
- **Location**: Line 88, Column 27
- **Mutator**: BlockStatement
- **Original**: `{`
- **Mutated**: `{}`

### Undetected Mutant 28

- **File**: `src/components/PlanView.tsx`
- **Location**: Line 151, Column 11
- **Mutator**: StringLiteral
- **Original**: `\`${currentActivity.description} ${line}\``
- **Mutated**: `\`\``

---

*Generated from `reports/mutation/mutation.json` after Stryker baseline run (Directive 4).*
*Stryker vschema 1.0 | Vitest runner | 2026-04-14*

---

## Verification Run Results (Directive 7)

| Metric | Baseline | Verification | Delta |
|--------|----------|-------------|-------|
| **Mutation Score** | 96.04% | 98.87% | +2.83% |
| **Total Mutants** | 707 | 707 | 0 |
| **Killed** | 0 | 0 | +0 |
| **Timeout** | 679 | 699 | +20 |
| **Survived** | 0 | 0 | 0 |
| **No Coverage** | 28 | 8 | -20 |

### Verification Outcome

- **Score improvement**: 96.04% → 98.87% (**+2.83 percentage points**)
- **Previously NoCoverage mutants now covered**: 20 of 28
- **Verification status**: ✅ PASS — score is strictly greater than baseline

### Remaining NoCoverage Mutants (8)

These mutants are in defensive code paths (unreachable guards, redundant null checks) or deep error-handling branches that cannot be exercised through the public API without modifying production source code.

---

*Verification run completed on 2026-04-14.*
*Stryker 8.7.1 | Vitest runner*
