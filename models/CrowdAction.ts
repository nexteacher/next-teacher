import { Schema, model, models } from 'mongoose';
import { CrowdAction } from '@/types/crowdAction';

const CrowdActionSchema = new Schema<CrowdAction>({
  walletAddress: { type: String, required: true, index: true },
  actionType: { type: String, required: true },
  targetType: { type: String, required: true },
  targetId: { type: String },
  payload: { type: Schema.Types.Mixed },
}, {
  timestamps: { createdAt: true, updatedAt: false },
});

CrowdActionSchema.index({ actionType: 1, targetType: 1, createdAt: -1 });
// 防止同一钱包地址对同一目标执行相同操作的重复记录
CrowdActionSchema.index({ walletAddress: 1, actionType: 1, targetType: 1, targetId: 1 }, { unique: true });

const CrowdActionModel = models.CrowdAction || model<CrowdAction>('CrowdAction', CrowdActionSchema);

export default CrowdActionModel;


