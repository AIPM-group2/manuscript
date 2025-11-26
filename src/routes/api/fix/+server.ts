import { json } from '@sveltejs/kit';
import { Fixer } from '../../../fixer';
import { promisify } from 'util';
import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

const execPromise = promisify(exec);

async function executePythonScript(documentPath: string, pythonCode: string): Promise<{ stdout: string; stderr: string }> {
  const tempDir = path.join(process.cwd(), 'temp_fixes');
  await fs.mkdir(tempDir, { recursive: true });
  const scriptPath = path.join(tempDir, `fix_${Date.now()}.py`);
  await fs.writeFile(scriptPath, pythonCode);

  const pythonExecutable = path.join(process.cwd(), '.venv', 'Scripts', 'python.exe');
  const runnerScript = path.join(process.cwd(), 'src/python/run_fix.py');

  try {
    const { stdout, stderr } = await execPromise(`${pythonExecutable} ${runnerScript} "${documentPath}" "${scriptPath}"`);
    return { stdout, stderr };
  } finally {
    await fs.unlink(scriptPath); // Clean up the temporary script
  }
}

export async function POST({ request }) {
  const { rule, justification, documentPath, apiKey } = await request.json();

  if (!rule || !justification || !documentPath) {
    return json({ error: 'Missing required parameters' }, { status: 400 });
  }

  if (!apiKey) {
    return json({ error: 'Missing credentials. Please pass an `apiKey`.' }, { status: 401 });
  }

  const autofixDir = path.join(process.cwd(), 'data', 'autofix');
  const outputFileName = `fixed-${path.basename(documentPath)}`;
  const outputPath = path.join(autofixDir, outputFileName);

  try {
    await fs.mkdir(autofixDir, { recursive: true });
    const fixer = new Fixer(apiKey);
    const pythonCode = await fixer.generateFixScript(rule, justification);

    // Execute the python script
    const result = await executePythonScript(documentPath, pythonCode);

    if (result.stderr) {
        return json({ error: `Error executing Python script: ${result.stderr}` }, { status: 500 });
    }

    return json({
      message: 'Fix script executed successfully.',
      pythonCode,
      output: result.stdout,
    });
  } catch (error: any) {
    return json({ error: error.message }, { status: 500 });
  }
}
