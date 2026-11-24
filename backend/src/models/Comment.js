import mongoose from 'mongoose';
const commentSchema = new mongoose.Schema({
  report: { type: mongoose.Schema.Types.ObjectId, ref: 'Report', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  authorName: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true, maxlength: 700 }
}, { timestamps: true });
export default mongoose.model('Comment', commentSchema);
