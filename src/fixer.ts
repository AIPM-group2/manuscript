import OpenAI from 'openai';

const MODEL_FOR_CODE_GENERATION = 'gpt-4o-mini'; // Or another model good at coding

export class Fixer {
  private client: OpenAI;

  constructor(private apiKey: string) {
    this.client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: apiKey,
      dangerouslyAllowBrowser: true,
    });
  }

  async generateFixScript(rule: string, justification: string, outputPath: string): Promise<string> {
    const prompt = `
You are an expert in Python and the python-docx library.
A formatting rule has failed for a .docx document. Your task is to generate a Python script to fix it.

**Formatting Rule:** ${rule}
**Reason for Failure:** ${justification}

**Instructions:**
1.  Write a Python script that takes two command-line arguments: the input file path and the output file path.
2.  The script should use the 'docx' library to open the input document and fix the specific issue described above.
3.  The script should save the modified document to the specified output path.
4.  The script should only contain the Python code, no explanations or markdown.
5.  Assume the 'python-docx' library is installed ('pip install python-docx').

**Example of a script that changes the font size of the first paragraph:**
\`\`\`python
import sys
from docx import Document
from docx.shared import Pt

def fix_document(input_path, output_path):
    document = Document(input_path)
    if document.paragraphs:
        # Example: Set font size for the first paragraph
        for run in document.paragraphs[0].runs:
            run.font.size = Pt(12)
    document.save(output_path)

if __name__ == "__main__":
    if len(sys.argv) > 2:
        fix_document(sys.argv[1], sys.argv[2])
\`\`\`

Now, generate the Python script for the rule and justification provided.
`.trim();

    const response = await this.client.chat.completions.create({
      model: MODEL_FOR_CODE_GENERATION,
      messages: [
        { role: 'system', content: 'You are a helpful assistant that generates Python code.' },
        { role: 'user', content: prompt },
      ],
    });

    const content = response.choices[0].message.content ?? '';
    return this.extractPythonCode(content);
  }

  private extractPythonCode(content: string): string {
    const pythonBlockRegex = /```python\n([\s\S]*?)\n```/;
    const match = content.match(pythonBlockRegex);
    if (match && match[1]) {
      return match[1];
    }
    // Fallback if the model doesn't use markdown fences
    return content;
  }
}
