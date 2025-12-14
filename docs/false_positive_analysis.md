# Ground Truth Analysis: False Positive Report

**Analysis Date**: December 10, 2025  
**Articles Analyzed**: 5 published Springer Pediatric Radiology articles

---

## Executive Summary

| Article | Pass Rate | Failures | Key Issue |
|---------|-----------|----------|-----------|
| article-2.docx | 35% | 36 | Commentary/advocacy paper misclassified |
| article-3.docx | 53% | 26 | EDI Editorial misclassified |
| article-4.docx | 60% | 22 | Pictorial review misclassified |
| article-5.docx | 56% | 24 | Pictorial review misclassified |
| article-6.docx | 58% | 23 | Systematic review - better fit |

**Root Cause**: Rules are calibrated for **Original Research** articles only. Published articles include **Reviews, Editorials, Pictorial Essays** which have different structure requirements.

---

## 🚨 Critical False Positives (HIGH PRIORITY TO FIX)

### 1. **Title Content** — FAILS on ALL 5 articles
| Article | Detected "Title" | Reality |
|---------|------------------|---------|
| All | `"Pediatric Radiology (2024) 54:XXX"` | PDF metadata header, not actual title |

**Root Cause**: PDF-to-DOCX conversion artifacts include journal citation as first line. The `DocxParser` is extracting this metadata instead of the actual title.

**Fix**: Update `DocxParser.extractTitle()` to skip lines matching pattern `Pediatric Radiology \(\d{4}\) \d+:\d+–\d+`

---

### 2. **Double-Blind Review Setup** — FAILS on ALL 5 articles
**Evidence**: All articles correctly contain author names, affiliations, emails because **they are published versions, not submission manuscripts**.

**Root Cause**: This rule is for **pre-submission validation**. Published PDFs naturally contain identifying info after acceptance.

**Fix**: Make this rule **optional** or add a toggle: "Validate for Submission (blind review)" vs "Validate Published Article"

---

### 3. **Declarations (Title Page)** — FAILS on ALL 5 articles
**Evidence**: Declarations exist in the published articles (typically at end per Springer format), but parser can't find them because:
- PDF conversion loses section headers
- Search scope limited to first 3000 chars

**Fix**: Expand search scope OR mark rule as SKIP for published articles.

---

### 4. **Manuscript Structure (IMRAD)** — FAILS on 4/5 articles
**Evidence**:
- article-2: *Commentary* — no Methods/Results required
- article-3: *Editorial/Opinion* — Discussion-focused, no IMRAD
- article-4, article-5: *Pictorial Review* — no traditional Methods section
- article-6: PASSES (Systematic Review has proper IMRAD)

**Root Cause**: Rule assumes all articles are Original Research. Many published papers are:
- Case Reports
- Editorials
- Pictorial Essays
- Reviews
- Letters

**Fix**: Add article type detection. Skip IMRAD check for non-research types.

---

### 5. **Abstract Structure Style** — FAILS on 4/5 articles
**Evidence**: Structured abstracts (Background/Methods/Results/Conclusion) are required for **Original Research** only. Reviews and Editorials use **unstructured** paragraphs per Springer guidelines.

**Fix**: Skip structured abstract check for non-research article types.

---

### 6. **Figure/Table Numbering** — FAILS due to PDF parsing artifacts
**Evidence**:
- article-3: `Found: 1, 1, 2, 2, 4, 4` — Duplicates from in-text references
- article-4: `Found: 1, 1, 2, 2, 2, 3, 3, 3...` — Same issue

**Root Cause**: Regex captures **both** figure references ("see Fig. 1") AND actual captions ("Fig. 1: Caption..."). Published PDFs reference figures multiple times.

**Fix**: Deduplicate figure numbers OR only count from caption context (following colon/descriptive text).

---

### 7. **Reference Numbering** — FAILS on ALL 5 articles
**Evidence**:
- article-2: `Found: 1394` — This is PAGE NUMBER from PDF, not reference
- article-4: `Found: 935` — Same issue
- article-6: `Found: 315` — Page range artifact

**Root Cause**: PDF conversion embeds page numbers that regex matches as reference numbers.

**Fix**: Filter out numbers > 100 as unlikely reference counts, OR require format `[1]. Author...`

---

### 8. **Keywords Count** — FAILS on ALL 5 articles
**Evidence**: Parser finds only 1 keyword, but articles have 4-6 keywords.

**Root Cause**: PDF conversion breaks keyword delimiter (middot ·). Parser can't split `"Advocacy · Gender diverse youth · Intersex"` properly.

**Fix**: Update keyword parser to handle both `·` (middot) and `,` delimiters.

---

### 9. **Citation-Reference Match** — WARNS on ALL 5 articles
**Evidence**: Reports "25 citations without refs" but references exist in document.

**Root Cause**: Reference section parsing fails because PDF conversion loses numbered list formatting.

**Fix**: Improve reference section detection to handle continuous text format.

---

## 📊 False Positive Frequency Summary

| Rule | FP Rate | Priority | Fix Complexity |
|------|---------|----------|----------------|
| Title Content | 5/5 (100%) | CRITICAL | Easy |
| Double-Blind Review Setup | 5/5 (100%) | CRITICAL | Easy (disable/toggle) |
| Declarations (Title Page) | 5/5 (100%) | HIGH | Medium |
| Reference Numbering | 5/5 (100%) | HIGH | Easy |
| Keywords Count | 5/5 (100%) | HIGH | Easy |
| Citation-Reference Match | 5/5 (100%) | MEDIUM | Medium |
| Manuscript Structure | 4/5 (80%) | HIGH | Medium (article type) |
| Abstract Structure Style | 4/5 (80%) | HIGH | Medium (article type) |
| Figure Numbering | 4/5 (80%) | MEDIUM | Easy |
| Table Numbering | 4/5 (80%) | MEDIUM | Easy |
| Competing Interests Declaration | 5/5 (100%) | MEDIUM | Medium |
| Methods Present | 3/5 (60%) | MEDIUM | Medium (article type) |

---

## ✅ Rules Working Correctly (True Passes)

These rules correctly passed on published ground truth:

| Rule | Pass Rate | Notes |
|------|-----------|-------|
| Citation Format | 5/5 | Correctly identifies [1], [2-4] format |
| DOI Format | 5/5 | Valid DOI detection |
| Email Format | 5/5 | Valid email detection |
| URL Format | 4/5 | Works (1 warning on incomplete URLs) |
| Title Present | 5/5 | Correctly detects presence |
| Abstract Present | 5/5 | Correctly detects presence |
| Keywords Present | 5/5 | Correctly detects presence |
| References Present | 5/5 | Correctly detects section |
| Author Information Present | 5/5 | Works well |
| Figure Captions Present | 5/5 | Works well |
| Table Captions Present | 5/5 | Works well |
| Abbreviation Definition Order | 4/5 | Works for most cases |
| Duplicate Headings | 4/5 | Works correctly |
| Clinical Trial Registration | 5/5 | Correctly identifies non-trials |
| Supplementary Captions | 5/5 | Correctly handles absence |

---

## 🔧 Recommended Fixes (Prioritized)

### Immediate (Quick Wins)
1. **Title Extraction**: Skip PDF metadata lines matching `Pediatric Radiology \(\d{4}\)`
2. **Keyword Parsing**: Split on `·` middot character
3. **Reference Number Filtering**: Ignore numbers > 100
4. **Figure Deduplication**: Unique() the figure number list

### Short-Term
5. **Add Article Type Detection**: Scan for keywords like "Review", "Commentary", "Editorial", "Case Report" in title/abstract
6. **Conditional IMRAD Check**: Skip for non-research types
7. **Toggle Blind Review**: Add "Published Article Mode" to skip author-related checks

### Medium-Term
8. **Improve Reference Parsing**: Handle continuous text format without numbered list
9. **Expand Declaration Search**: Check entire document, not just first 3000 chars
10. **PDF Conversion Quality**: Consider alternative PDF-to-DOCX converter

---

## 📈 Expected Accuracy After Fixes

| Current | After Immediate Fixes | After All Fixes |
|---------|----------------------|-----------------|
| ~45-60% | ~70-75% | ~90%+ |

---

## Appendix: Per-Article Details

### article-2.docx (Advocacy Commentary)
- **Type**: Commentary/Opinion piece on healthcare advocacy
- **Key FPs**: No IMRAD (intentional), no structured abstract (correct for commentary)
- **Special**: 65-word abstract is intentionally brief for commentary format

### article-3.docx (EDI Editorial)
- **Type**: Editorial on Equity, Diversity, Inclusion
- **Key FPs**: Discussion-only structure (no Methods/Results), NHS abbreviation flagged but it's institutional name

### article-4.docx (Orbital Neoplasm Pictorial Review)
- **Type**: Pictorial Essay/Review
- **Key FPs**: No traditional Methods (imaging review), extensive figure references counted as duplicates

### article-5.docx (Ocular Imaging Pictorial Review)
- **Type**: Pictorial Essay
- **Key FPs**: Abbreviations US/CT/MRI are standard in radiology context (should not require definition)

### article-6.docx (Scoliosis Systematic Review)
- **Type**: Systematic Review (best-fit for IMRAD rules)
- **Key FPs**: Abstract 259 words (9 over limit) — overly strict threshold
- **Note**: Best performing article because closest to Original Research format
