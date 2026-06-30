import mongoose from 'mongoose';

const SkipRuleSchema = new mongoose.Schema({
  day:  { type: String, required: true },
  meal: { type: String, required: true },
});

const UserSchema = new mongoose.Schema(
  {
    name:           { type: String, required: true, trim: true },
    email:          { type: String, required: true, unique: true, lowercase: true },
    password:       { type: String, required: true },
    dietGoal:       { type: String, enum: ['bulk', 'maintain', 'lose'], default: 'maintain' },
    dailyBudget:    { type: Number, default: null },
    monthlyBudget:  { type: Number, default: null },
    messMenu:       { type: String, default: '' },
    skipRules:      { type: [SkipRuleSchema], default: [] },
    location: {
      lat:  { type: Number, default: null },
      lng:  { type: Number, default: null },
      city: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model('User', UserSchema);
