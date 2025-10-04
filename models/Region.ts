import mongoose, { Schema, model, models } from 'mongoose';

export interface SchoolRegion {
  code: string; // 唯一代码，如 CN, HK, US
  name: string; // 显示名称，如 中国大陆、香港、美国
  order?: number; // 排序
  isActive?: boolean;
}

const RegionSchema = new Schema<SchoolRegion>({
  code: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

RegionSchema.index({ order: 1 });
RegionSchema.index({ isActive: 1 });

const RegionModel = models.Region || model<SchoolRegion>('Region', RegionSchema);

export default RegionModel;


