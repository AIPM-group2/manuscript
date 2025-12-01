import { json, error } from "@sveltejs/kit";
import { AIAnalyser } from "../../../smarts.js";
import { generalRules } from "../../../general_rules.js";
import { runDeterministicChecks } from "../../../deterministic_checks.js";

export const POST = async ({ request }) => {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw error(400, "Missing or invalid file");
  }

  const apiKey = process.env.GEMINI_API_KEY ?? process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw error(500, "Missing AI API key on the server");
  }

  const analyser = new AIAnalyser(apiKey);

  const { html, xmlFiles } = await analyser.analyzeFile(file);
  const ruleResults = await analyser.analyzeRules(file.name, file.type, html, generalRules);

  const deterministic = runDeterministicChecks(xmlFiles);
  deterministic.forEach((result) => {
    ruleResults[result.rule] = result;
  });

  return json({
    summary: "Document analyzed successfully!",
    html,
    xmlFiles,
    ruleResults,
    deterministicChecks: deterministic,
  });
};

