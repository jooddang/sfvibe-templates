import { NextRequest, NextResponse } from 'next/server';
import { getUploadPresignedUrl, getPublicUrl } from '@/lib/s3';
import { auth } from '@/auth';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { filename, contentType } = await request.json();

    if (!filename || !contentType) {
      return NextResponse.json({ error: 'Missing filename or contentType' }, { status: 400 });
    }

    const extension = filename.split('.').pop();
    const key = `uploads/${session.user.id}/${uuidv4()}.${extension}`;

    const { url } = await getUploadPresignedUrl(key, contentType);
    const publicUrl = getPublicUrl(key);

    return NextResponse.json({ url, key, publicUrl });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 });
  }
}
