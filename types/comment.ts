export interface Comment {
  _id: string;
  teacher: string; // Teacher ObjectId as string
  walletAddress: string;
  rating: number; // 1-5
  content: string; // 10-1500 chars
  source?: 'user' | 'admin' | 'imported';
  importedFrom?: string;
  likedBy?: string[];
  dislikedBy?: string[];
  likeCount?: number;
  dislikeCount?: number;
  userReaction?: 'like' | 'dislike' | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentPayload {
  walletAddress: string;
  rating: number;
  content: string;
}

