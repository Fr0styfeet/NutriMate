import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
import ChatSession from '@/models/ChatSession';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const DIET_GUIDELINES = {
  bulk:     { calories: '2800–3500 kcal/day', protein: '1.6–2.2g per kg body weight', carbs: 'High carb (45–60%)', fat: 'Moderate fat (20–35%)', goal: 'Muscle gain and strength building' },
  maintain: { calories: '2000–2500 kcal/day', protein: '0.8–1.2g per kg body weight', carbs: 'Moderate carbs (40–50%)', fat: 'Balanced fat (25–35%)', goal: 'Maintain current weight' },
  lose:     { calories: '1500–1800 kcal/day', protein: '1.2–1.6g per kg body weight', carbs: 'Lower carbs (30–40%)', fat: 'Moderate fat (25–35%)', goal: 'Fat loss while preserving muscle' },
};

export async function POST(req) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const user = await User.findById(auth.userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { message, sessionId } = await req.json();
    if (!message?.trim()) return NextResponse.json({ error: 'Message required' }, { status: 400 });

    // Load or create session
    let session;
    if (sessionId) {
      session = await ChatSession.findOne({ _id: sessionId, userId: auth.userId });
    }
    if (!session) {
      session = await ChatSession.create({ userId: auth.userId, title: 'New conversation' });
    }

    // Push user message
    session.messages.push({ role: 'user', content: message });

    // Build Gemini context
    const g = DIET_GUIDELINES[user.dietGoal];
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const skips = user.skipRules.map(r => `${r.meal} on ${r.day}`).join(', ') || 'none';

    const systemPrompt = `You are NutriMate, an expert AI diet planner for college students in India.
You follow ICMR-NIN 2020 nutritional guidelines for young adults.

USER PROFILE:
- Diet Goal: ${user.dietGoal.toUpperCase()} — ${g.goal}
- Daily Budget: ₹${user.dailyBudget || 'not set'}
- Monthly Budget: ₹${user.monthlyBudget || 'not set'}
- Today: ${today}
- Meals they skip: ${skips}

MESS MENU (hostel food):
${user.messMenu || 'No mess menu provided yet'}

NUTRITIONAL TARGETS (${user.dietGoal}):
- Calories: ${g.calories}
- Protein: ${g.protein}
- Carbs: ${g.carbs}
- Fat: ${g.fat}

RESPONSE FORMAT:
For meal planning requests, respond ONLY with this JSON:
{
  "type": "plan",
  "summary": "Brief strategy for today",
  "restaurantOptions": [
    {"name":"Dish","from":"Where","cost":"₹XX","calories":"~XXX kcal","why":"Fits goal because..."}
  ],
  "diyOptions": [
    {"name":"Recipe","ingredients":"List","cost":"₹XX","calories":"~XXX kcal","prep":"X min"}
  ],
  "snackingOptions": [
    {"name":"Snack","cost":"₹XX","calories":"~XXX kcal","benefit":"Key benefit"}
  ],
  "dailyTip": "One evidence-based tip"
}

For general questions respond ONLY with:
{"type":"chat","message":"Your response here"}

Keep costs realistic for Indian college students (₹20–150 range). Prioritize mess menu items when available.`;

    // Build history for Gemini (exclude the new message we just pushed)
    const history = session.messages.slice(0, -1).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.planData ? JSON.stringify(m.planData) : m.content }],
    }));

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const chat  = model.startChat({
      history: [
        { role: 'user',  parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: '{"type":"chat","message":"Ready to help with personalized diet planning!"}' }] },
        ...history,
      ],
    });

    const result = await chat.sendMessage(message);
    const raw    = result.response.text().trim();

    let planData;
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      planData = match ? JSON.parse(match[0]) : { type: 'chat', message: raw };
    } catch {
      planData = { type: 'chat', message: raw };
    }

    // Push assistant message with structured data
    session.messages.push({
      role: 'assistant',
      content: planData.message || planData.summary || '',
      planData,
    });

    // Auto-title from first user message
    if (session.messages.length === 2) {
      session.title = message.slice(0, 50) + (message.length > 50 ? '…' : '');
    }

    await session.save();

    return NextResponse.json({ response: planData, sessionId: session._id });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to generate plan' }, { status: 500 });
  }
}
