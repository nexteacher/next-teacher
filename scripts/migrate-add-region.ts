import connectDB from '../lib/mongodb';
import TeacherModel from '../models/Teacher';

/**
 * 迁移脚本：为所有现有教师添加 region 字段
 * 默认值：CN（中国大陆）
 */
async function migrateAddRegion() {
  try {
    console.log('🔄 开始迁移：为教师添加 region 字段...');
    
    await connectDB();
    console.log('✅ 数据库连接成功');
    
    // 统计需要更新的教师数量
    const teachersWithoutRegion = await TeacherModel.countDocuments({ 
      region: { $exists: false } 
    });
    
    console.log(`📊 发现 ${teachersWithoutRegion} 位教师需要添加 region 字段`);
    
    if (teachersWithoutRegion === 0) {
      console.log('✅ 所有教师已有 region 字段，无需迁移');
      return;
    }
    
    // 批量更新所有没有 region 字段的教师
    const result = await TeacherModel.updateMany(
      { region: { $exists: false } },
      { $set: { region: 'CN' } }
    );
    
    console.log(`✅ 成功更新 ${result.modifiedCount} 位教师`);
    
    // 验证更新结果
    const remainingWithoutRegion = await TeacherModel.countDocuments({ 
      region: { $exists: false } 
    });
    
    if (remainingWithoutRegion === 0) {
      console.log('🎉 迁移完成！所有教师都已有 region 字段');
    } else {
      console.warn(`⚠️  仍有 ${remainingWithoutRegion} 位教师没有 region 字段`);
    }
    
    // 显示统计信息
    const regionStats = await TeacherModel.aggregate([
      { $group: { _id: '$region', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n📊 按地区统计：');
    regionStats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} 位教师`);
    });
    
  } catch (error) {
    console.error('❌ 迁移失败:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  migrateAddRegion();
}

export default migrateAddRegion;

