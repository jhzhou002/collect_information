<template>
  <div class="dashboard">
    <h2 class="page-title">数据统计</h2>

    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon total">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.totalSubmissions }}</div>
              <div class="stat-label">总提交数</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon unpaid">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.unpaidSubmissions }}</div>
              <div class="stat-label">未结算</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon paid">
              <el-icon><Check /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.paidSubmissions }}</div>
              <div class="stat-label">已结算</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon users">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.totalUsers }}</div>
              <div class="stat-label">总用户数</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getStatistics } from '../api/admin'

const statistics = ref({
  totalSubmissions: 0,
  unpaidSubmissions: 0,
  paidSubmissions: 0,
  totalUsers: 0
})

const loadStatistics = async () => {
  try {
    const res = await getStatistics()
    statistics.value = res.data
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

onMounted(() => {
  loadStatistics()
})
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #333;
}

.stats-row {
  margin-top: 20px;
}

.stat-card {
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  color: white;
}

.stat-icon.total {
  background: linear-gradient(135deg, #718096 0%, #4a5568 100%);
}

.stat-icon.unpaid {
  background: linear-gradient(135deg, #f6ad55 0%, #ed8936 100%);
}

.stat-icon.paid {
  background: linear-gradient(135deg, #68d391 0%, #48bb78 100%);
}

.stat-icon.users {
  background: linear-gradient(135deg, #63b3ed 0%, #4299e1 100%);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #333;
  line-height: 1;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #999;
}
</style>
