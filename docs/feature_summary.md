# ApexScript Manuscript Validator — Feature Summary

---

## ✅ DEVELOPED FEATURES (Production Ready)

### 1. **Document Parsing & Analysis**
| Feature | Description | Status |
|---------|-------------|--------|
| DOCX Upload | Drag-and-drop or click-to-upload `.docx` files | ✅ Complete |
| UDO Extraction | Parses DOCX into Unified Document Object (title, abstract, sections, citations, figures, tables) | ✅ Complete |
| High-Fidelity Preview | Uses `docx-preview` to render document with original formatting, tables, images | ✅ Complete |

### 2. **Validation Engine (55+ Rules)**
| Rule Type | Count | Examples |
|-----------|-------|----------|
| **Programmatic** (Instant) | ~40 | Citation format `[1]`, Figure numbering `Fig. 1`, Word counts, SI units |
| **Semantic** (AI-powered) | ~15 | Title quality, Abstract content, Declaration presence, Blinding compliance |

**Key Capabilities:**
- ✅ Pattern matching (regex-based)
- ✅ Measurement rules (word counts, limits)
- ✅ Presence checks (required sections)
- ✅ AI Chain-of-Thought reasoning with Grok 4.1 Fast
- ✅ Journal-specific configuration (Pediatric Radiology)

### 3. **Document Viewer with Error Highlighting**
| Feature | Description |
|---------|-------------|
| Side-by-side layout | Document on left, errors on right |
| Section grouping | Errors grouped by Abstract, References, Figures, etc. |
| Click-to-scroll | Click error → scrolls to relevant section |
| Visual feedback | 3-second red pulse animation on target section |
| Severity coding | Critical (red), Warning (amber), Info (blue) |

### 4. **AutoFix System**
| Feature | Description |
|---------|-------------|
| AI-generated fixes | Uses Grok 4.1 Fast to suggest corrections |
| Original vs Suggested diff | Side-by-side comparison |
| Accept/Reject workflow | User approves each fix |
| **Safe vs Manual classification** | ✅ Only formatting/structural rules show "Generate Fix" button |
| Manual-only indicator | Content-related rules show "🛠️ Manual Fix Required" message |
| Export fixed document | Applies accepted fixes to original DOCX and downloads |

### 5. **Export & Reporting**
| Feature | Description |
|---------|-------------|
| Export Analysis JSON | Full report with reasoning, evidence, and AI explanations |
| Export Fixed Document | Downloads modified DOCX with applied fixes |
| Pass rate dashboard | Visual stats grid showing compliance percentage |

### 6. **Authentication & UI**
| Feature | Description |
|---------|-------------|
| Mock login/signup | Email/password forms (mocked, no backend) |
| API key management | User enters OpenRouter API key, stored in browser |
| Responsive design | Works on desktop and tablet |
| Premium aesthetics | Glassmorphism, gradients, micro-animations |

### 7. **Accuracy Benchmarking Infrastructure**
| Feature | Description |
|---------|-------------|
| Ground truth DOCX files | 5 published Springer articles converted from PDF |
| `benchmark.ts` script | Runs all validators against ground truth |
| `analyze_fp.ts` script | Digests exported JSON to identify False Positives |
| Enhanced evidence prompts | AI now quotes exact text for violations |

---

## 🔮 PLANNED FEATURES (Future Development)

### 1. **Precision Improvements**

| Feature | Description | Priority |
|---------|-------------|----------|
| **Exact text highlighting** | Wrap problematic text with `<mark>` in preview | HIGH |
| **Robust DOCX writer** | Handle text split across XML elements | HIGH |
| **Validators populate `location.text`** | Programmatic/Semantic return exact snippet | HIGH |

### 2. **Multi-Journal Support**

| Feature | Description | Priority |
|---------|-------------|----------|
| Journal selector dropdown | Choose from multiple journals | MEDIUM |
| Dynamic rule loading | Load rules from `config/journals/` | MEDIUM |
| Additional journals | Radiology, European Radiology, RSNA journals | LOW |

### 3. **Backend & Persistence**

| Feature | Description | Priority |
|---------|-------------|----------|
| Real authentication | OAuth (Google, ORCID) or email/password with backend | HIGH |
| User accounts | Store history, preferences, API keys securely | HIGH |
| Cloud storage | Save validated documents to cloud | MEDIUM |
| Team collaboration | Share reports with co-authors | LOW |

### 4. **Advanced AI Features**

| Feature | Description | Priority |
|---------|-------------|----------|
| Batch validation | Upload multiple DOCX files at once | MEDIUM |
| AI-powered rewriting | For unsafe rules (with user approval) | LOW |
| Citation verification | Cross-check DOIs against Crossref/PubMed | MEDIUM |
| Plagiarism detection | Integration with iThenticate or similar | LOW |

### 5. **Analytics & Feedback Loop**

| Feature | Description | Priority |
|---------|-------------|----------|
| Rule accuracy dashboard | Show precision/recall per rule | HIGH |
| User feedback collection | "Was this error correct?" button | MEDIUM |
| Continuous learning | Tune rules based on user corrections | LOW |

### 6. **Accessibility & UX**

| Feature | Description | Priority |
|---------|-------------|----------|
| Keyboard navigation | Full a11y compliance | MEDIUM |
| Dark mode toggle | User preference | LOW |
| Progress persistence | Resume interrupted analyses | MEDIUM |

---

## 📊 CURRENT ARCHITECTURE SUMMARY

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (SvelteKit)                     │
├─────────────────────────────────────────────────────────────┤
│  Dashboard → DocumentViewer → AutoFixPanel → FixSummaryBar  │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                      ANALYZER ENGINE                         │
├─────────────────────────────────────────────────────────────┤
│  DocxParser → UDO → ProgrammaticValidator → SemanticValidator│
│                          ↓                        ↓          │
│                   RuleResult[]              RuleResult[]     │
│                          └──────────┬───────────┘            │
│                                     ▼                        │
│                           ValidationReport                   │
└─────────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                      EXTERNAL APIs                           │
├─────────────────────────────────────────────────────────────┤
│  OpenRouter (Grok 4.1 Fast) for Semantic Validation + AutoFix│
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 IMMEDIATE NEXT STEPS (Recommended)

1. **Run Ground Truth Benchmark** — Analyze 5 published articles, export JSONs, identify False Positives
2. **Tune Rules** — Adjust regex patterns and AI prompts based on benchmark
3. **Fix Remaining Blockers** — Exact text highlighting, robust DOCX writer
4. **Deploy to Production** — Push to GitHub Pages with 404.html fix
