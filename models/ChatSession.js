import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  role:      { type: String, enum: ['user', 'assistant'], required: true },
  content:   { type: String, required: true },
  planData:  { type: mongoose.Schema.Types.Mixed, default: null }, // structured Gemini response
  createdAt: { type: Date, default: Date.now },
});

const ChatSessionSchema = new mongoose.Schema(
  {
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title:     { type: String, default: 'New conversation' },
    messages:  { type: [MessageSchema], default: [] },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Auto-update updatedAt on message push
ChatSessionSchema.pre('save', function () {
  this.updatedAt = new Date();
});

export default mongoose.models.ChatSession || mongoose.model('ChatSession', ChatSessionSchema);
