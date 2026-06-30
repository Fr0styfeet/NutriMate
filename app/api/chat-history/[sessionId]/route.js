import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ChatSession from '@/models/ChatSession';
import { getUserFromRequest } from '@/lib/auth';

// GET    /api/chat-history/[sessionId]  → fetch full session with messages
// PATCH  /api/chat-history/[sessionId]  → rename title
// DELETE /api/chat-history/[sessionId]  → delete session
export async function GET(req, { params }) {
  const { sessionId } = await params;
  const auth = getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const session = await ChatSession.findOne({ _id: sessionId, userId: auth.userId });
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ session });
}

export async function PATCH(req, { params }) {
  const { sessionId } = await params;
  const auth = getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { title } = await req.json();
  await connectDB();
  const session = await ChatSession.findOneAndUpdate(
    { _id: sessionId, userId: auth.userId },
    { title },
    { new: true }
  );
  return NextResponse.json({ session });
}

export async function DELETE(req, { params }) {
  const { sessionId } = await params;
  const auth = getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  await ChatSession.findOneAndDelete({ _id: sessionId, userId: auth.userId });
  return NextResponse.json({ ok: true });
}
