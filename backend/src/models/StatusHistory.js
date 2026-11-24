import mongoose from 'mongoose';
const historySchema = new mongoose.Schema({
  report: { type: mongoose.Schema.Types.ObjectId, ref: 'Report', required: true, index: true },
  previousStatus: { type: String, required: true },
  newStatus: { type: String, required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  remarks: { type: String, default: '', maxlength: 500 }
}, { timestamps: true });
export default mongoose.model('StatusHistory', historySchema);
