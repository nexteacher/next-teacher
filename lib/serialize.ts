// 序列化 MongoDB 对象为普通 JavaScript 对象
export function serializeMongoObject(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (obj instanceof Date) {
    return obj.toISOString();
  }
  
  if (obj && typeof obj === 'object' && 'toString' in obj && typeof obj.toString === 'function' && obj.constructor.name === 'ObjectId') {
    return obj.toString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => serializeMongoObject(item));
  }
  
  if (typeof obj === 'object') {
    const serialized: Record<string, unknown> = {};
    for (const key in obj as Record<string, unknown>) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        serialized[key] = serializeMongoObject((obj as Record<string, unknown>)[key]);
      }
    }
    return serialized;
  }
  
  return obj;
}
