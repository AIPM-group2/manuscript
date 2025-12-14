# Rule Configuration Updates for Pediatric Radiology

**Objective**: Modify the existing `general_rules.ts` configuration to align with *Springer Pediatric Radiology* guidelines. Do NOT create new rules. ONLY update the parameters of existing rules.

---

## **1. Rule 5: Keywords Count**
**Current**: `min: 3, max: 6`
**New**: `min: 4, max: 6`

**Action**: Find `Keywords Check` logic (or Rule 5) and update the minimum threshold.

```typescript
// IN general_rules.ts
// Find:
const minKeywords = 3; 

// Replace with:
const minKeywords = 4; // Updated for Pediatric Radiology guidelines
```

---

## **2. Rule 13: Abstract Structure**
**Current**: Expects `["Background", "Methods", "Results", "Conclusion"]`
**New**: Expects `["Background", "Objective", "Materials and methods", "Results", "Conclusion"]`

**Action**: Find `Abstract Structure Style` logic (or Rule 13) and update the required section headers.

```typescript
// IN general_rules.ts
// Find:
const requiredSections = ["Background", "Methods", "Results", "Conclusion"];

// Replace with:
const requiredSections = [
  "Background", 
  "Objective",  // Added per guidelines
  "Materials and methods", // Specific wording
  "Results", 
  "Conclusion"
];
```

---

## **3. Rule 2: Abstract Word Count**
**Current**: `min: 150, max: 250`
**New**: 
- **Original Article**: `150-250` (Keep same)
- **Case Report**: `< 125` (Conditional update needed if you support Case Reports)

**Action**: No change needed for MVP (Original Articles). Keep as is.

---

## **4. Rule 4: Double-Blind Review (Anonymity)**
**Current**: Generic anonymity check.
**New**: Must enforce *strict* absence of author names, affiliations, and self-citations like "we previously showed [1]".

**Action**: Update the prompt/logic for Rule 4 to be stricter.

```typescript
// IN general_rules.ts (inside the semantic rule definition)
// Update the prompt/description to include:
"Check for any identifying information including author names, affiliations, and self-referencing phrases like 'we previously showed' or 'in our previous study'."
```

---

## **Summary of Changes**

| Rule ID | Name | Parameter to Change | New Value |
|---------|------|---------------------|-----------|
| **5** | Keywords Check | Min Count | **4** |
| **13** | Abstract Structure | Expected Headers | **Add "Objective"** |
| **4** | Double-Blind | Check Logic | **Add strict self-citation check** |

**ALL OTHER RULES REMAIN UNCHANGED.** They already match the guidelines.
