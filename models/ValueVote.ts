import { Schema, model, models } from 'mongoose';
import { ValueVote } from '@/types/valueVote';

const ValueVoteSchema = new Schema<ValueVote>({
  pagePath: { type: String, required: true, index: true },
  walletAddress: { type: String, required: true, index: true },
  value: { type: String, enum: ['valuable', 'not_valuable'], required: true },
}, {
  timestamps: true,
});

// 一个钱包对同一页面只能保留最新一条记录；可用唯一复合索引防止重复
ValueVoteSchema.index({ pagePath: 1, walletAddress: 1 }, { unique: true });

const ValueVoteModel = models.ValueVote || model<ValueVote>('ValueVote', ValueVoteSchema);
export default ValueVoteModel;


