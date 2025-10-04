import { Schema, model, models, Types } from 'mongoose';

interface CommentDoc {
  teacher: Types.ObjectId;
  walletAddress: string;
  rating: number;
  content: string;
  source?: 'user' | 'admin' | 'imported';
  importedFrom?: string;
  likedBy?: string[];
  dislikedBy?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<CommentDoc>({
  teacher: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true, index: true },
  walletAddress: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    minlength: 32,
    maxlength: 64,
  },
  rating: { type: Number, required: true, min: 1, max: 5 },
  content: { type: String, required: true, minlength: 10, maxlength: 1500 },
  source: { type: String, enum: ['user', 'admin', 'imported'], default: 'user', index: true },
  importedFrom: { type: String },
  likedBy: { type: [String], default: [], index: true },
  dislikedBy: { type: [String], default: [], index: true },
}, {
  timestamps: true,
});

CommentSchema.index({ teacher: 1, createdAt: -1 });

const CommentModel = models.Comment || model<CommentDoc>('Comment', CommentSchema);

export default CommentModel;

