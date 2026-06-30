import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req) {
  const auth = getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const user = await User.findById(auth.userId).select('-password');
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  return NextResponse.json({ user });
}

export async function PUT(req) {
  const auth = getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { dietGoal, dailyBudget, monthlyBudget, messMenu, skipRules, location } = body;

  await connectDB();
  const updated = await User.findByIdAndUpdate(
    auth.userId,
    {
      ...(dietGoal     !== undefined && { dietGoal }),
      ...(dailyBudget  !== undefined && { dailyBudget }),
      ...(monthlyBudget !== undefined && { monthlyBudget }),
      ...(messMenu     !== undefined && { messMenu }),
      ...(skipRules    !== undefined && { skipRules }),
      ...(location     !== undefined && { location }),
    },
    { new: true }
  ).select('-password');

  return NextResponse.json({ user: updated });
}
