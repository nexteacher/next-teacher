export type ValueVoteType = 'valuable' | 'not_valuable';

export interface ValueVote {
  _id?: string;
  pagePath: string; // 唯一标识一个页面（如 /teachers/{id} 或 /search）
  walletAddress: string; // 投票的钱包地址
  value: ValueVoteType; // 有价值/无价值
  createdAt: Date;
  updatedAt: Date;
}


