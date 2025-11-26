import { json } from '@sveltejs/kit';
import fs from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'data', 'uploads');

export async function POST({ request }) {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return json({ error: 'No file uploaded.' }, { status: 400 });
    }

    const tempFileName = `${Date.now()}-${file.name}`;
    const filePath = path.join(UPLOAD_DIR, tempFileName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    return json({ filePath });
  } catch (error: any) {
    return json({ error: `File upload failed: ${error.message}` }, { status: 500 });
  }
}
