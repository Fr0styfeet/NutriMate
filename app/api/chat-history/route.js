import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ChatSession from '@/models/ChatSession';
import { getUserFromRequest } from '@/lib/auth';

// GET  /api/chat-history           → list all sessions for user
// POST /api/chat-history           → create new session
export async function GET(req) {
  const auth = getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const sessions = await ChatSession.find({ userId: auth.userId })
    .select('_id title updatedAt messages')
    .sort({ updatedAt: -1 })
    .lean();

  return NextResponse.json({ sessions });
}

export async function POST(req) {
  const auth = getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const session = await ChatSession.create({ userId: auth.userId, title: 'New conversation' });

  return NextResponse.json({ session });
}
