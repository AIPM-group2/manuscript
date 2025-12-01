import { AIAnalyser } from "./smarts.js";
import { generalRules } from "./general_rules.js";

/*
// Example usage of the new analyzeRules method
async function exampleUsage() {
  // Initialize the AI analyzer with your API key
  const apiKey = "your-openrouter-api-key";
  const analyzer = new AIAnalyser(apiKey);

  // Sample document content (this would typically come from a DOCX file)
  const documentContent = `
    <h1>Research Paper Title</h1>

    <h2>Abstract</h2>
    <p>This is a sample abstract that contains exactly one hundred and fifty words to test the abstract length rule. The abstract should be between 150 and 250 words according to the journal guidelines. This abstract does not contain any undefined abbreviations and follows the proper formatting requirements. The content discusses the methodology and findings of the research study in a clear and concise manner.</p>

    <h2>Introduction</h2>
    <p>This section introduces the research topic and provides background information.</p>

    <h2>Methods</h2>
    <p>The methodology section describes how the research was conducted. See Figure 1 for details [1].</p>

    <h2>Results</h2>
    <p><strong>Fig. 1</strong> Sample figure caption that follows the proper formatting</p>
    <p>The results show significant findings as referenced in [2-4].</p>

    <h2>References</h2>
    <ol>
      <li>[1] Smith, J. et al. Sample Reference. Journal Name. 2023. DOI: https://doi.org/10.1000/sample</li>
      <li>[2] Johnson, A. Another Reference. Journal Name. 2022.</li>
      <li>[3] Brown, B. Third Reference. Journal Name. 2021.</li>
      <li>[4] Davis, C. Fourth Reference. Journal Name. 2020.</li>
    </ol>
  `;

  try {
    // Analyze the document against all rules
    console.log("Analyzing document against formatting rules...");
    const results = await analyzer.analyzeRules(documentContent, generalRules);

    // Display results
    console.log("\n=== Analysis Results ===\n");

    for (const [ruleName, result] of Object.entries(results)) {
      console.log(`Rule: ${ruleName}`);
      console.log(`Decision: ${result.decision ? "✅ PASS" : "❌ FAIL"}`);
      console.log(`Justification: ${result.justification}`);
      console.log("-".repeat(50));
    }

    // Summary
    const passCount = Object.values(results).filter((r) => r.decision).length;
    const totalCount = Object.keys(results).length;
    console.log(`\nSummary: ${passCount}/${totalCount} rules passed`);

    return results;
  } catch (error) {
    console.error("Error analyzing document:", error);
    throw error;
  }
}

// Example with file upload
async function analyzeUploadedFile(file: File) {
  const apiKey = "your-openrouter-api-key";
  const analyzer = new AIAnalyser(apiKey);

  try {
    // First extract content from the DOCX file
    console.log("Extracting content from DOCX file...");
    const extractedContent = await analyzer.analyzeFile(file);

    // Then analyze against rules
    console.log("Analyzing extracted content against rules...");
    const results = await analyzer.analyzeRules(extractedContent, generalRules);

    return results;
  } catch (error) {
    console.error("Error processing file:", error);
    throw error;
  }
}

export { exampleUsage, analyzeUploadedFile }; */
