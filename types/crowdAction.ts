export type CrowdActionType = 'create' | 'read' | 'update' | 'delete' | 'like' | 'unlike' | 'dislike' | 'undislike';

export type CrowdTargetType = 'teacher' | 'comment' | 'other';

export interface CrowdAction {
  _id?: string;
  walletAddress: string;
  actionType: CrowdActionType;
  targetType: CrowdTargetType;
  targetId?: string;
  payload?: Record<string, unknown>;
  createdAt: Date;
}


