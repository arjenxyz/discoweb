import { NextResponse } from 'next/server';
import { isAdminOrDeveloper } from '@/lib/adminAuth';

export async function POST(request: Request) {
  // Developer doğrulama
  const isAuth = await isAdminOrDeveloper();
  if (!isAuth) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  try {
    const body = await request.json();
    const { title, content, color } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Başlık ve içerik gerekli.' }, { status: 400 });
    }

    const botApiUrl = process.env.BOT_API_URL || 'http://localhost:3000';
    
    // Bot API'sine isteği gönder
    const response = await fetch(`${botApiUrl}/api/broadcast-system`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        content,
        color
      }),
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: 'Bot API hatası' };
      }
      throw new Error(errorData.error || 'Bot API isteği başarısız.');
    }

    const result = await response.json();
    return NextResponse.json({ 
      success: true, 
      successCount: result.successCount || 0,
      failCount: result.failCount || 0
    });

  } catch (err: any) {
    console.error('Broadcast endpoint error:', err);
    return NextResponse.json({ error: err.message || 'Sunucu hatası.' }, { status: 500 });
  }
}
