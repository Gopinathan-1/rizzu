import { extractTextFromBinary, summarizeMemory } from '../_shared/gemini.ts';
import { getAuthedClient, getServiceRoleClient, handleCorsPreflight, withCors } from '../_shared/supabase.ts';

const encoder = new TextEncoder();
const WORKSPACE_BUCKET = 'workspace_uploads';

function getFileExtension(filename?: string) {
  return filename?.toLowerCase().split('.').pop() ?? '';
}

function isTextFile(filename?: string, fileType?: string) {
  const extension = getFileExtension(filename);
  return extension === 'txt' || extension === 'md' || Boolean(fileType?.startsWith('text/'));
}

function safeJson(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    const match = value.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : { title: 'New chat' };
  }
}

Deno.serve(async (request) => {
  const preflightResponse = handleCorsPreflight(request);
  if (preflightResponse) {
    return preflightResponse;
  }

  try {
    const { client, user } = await getAuthedClient(request);
    const body = await request.json();
    const chatId = String(body.chatId ?? '');
    const storagePath = String(body.storagePath ?? '');
    const filename = String(body.filename ?? 'upload');
    const fileType = String(body.fileType ?? 'application/octet-stream');

    if (!chatId || !storagePath) {
      return new Response(JSON.stringify({ error: 'Missing chatId or storagePath' }), { status: 400 });
    }

    const fileResponse = await client.storage.from(WORKSPACE_BUCKET).download(storagePath);
    if (!fileResponse.data) {
      throw new Error('Upload file not found in storage');
    }

    const fileBuffer = new Uint8Array(await fileResponse.data.arrayBuffer());
    const extractedText = isTextFile(filename, fileType)
      ? new TextDecoder().decode(fileBuffer)
      : await extractTextFromBinary(fileBuffer, fileType, filename);

    const summary = await summarizeMemory({
      chatTitle: filename,
      extractedText,
      responseText: extractedText.slice(0, 3000),
    });

    const db = getServiceRoleClient();
    const { data: upload } = await db
      .from('uploads')
      .insert({
        user_id: user.id,
        chat_id: chatId,
        filename,
        file_type: fileType,
        storage_path: storagePath,
        extracted_text: extractedText,
        status: 'indexed',
      })
      .select('id, user_id, chat_id, filename, file_type, storage_path, created_at')
      .single();

    await db.from('memories').insert({
      user_id: user.id,
      chat_id: chatId,
      summary,
    });

    return withCors(
      new Response(
      JSON.stringify({
        upload,
        extractedText,
        summary,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
      )
    );
  } catch (error) {
    return withCors(
      new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Upload processing failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    );
  }
});
