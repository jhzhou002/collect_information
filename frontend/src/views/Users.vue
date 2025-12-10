<template>
  <div class="users-container">
    <el-card class="header-card">
      <h2>用户管理</h2>
      <p class="subtitle">管理小程序用户信息</p>
    </el-card>

    <el-card class="table-card">
      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-input
          v-model="searchQuery"
          placeholder="搜索用户昵称或OpenID"
          style="width: 300px"
          clearable
          @clear="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>

      <!-- 用户列表 -->
      <el-table
        :data="users"
        border
        style="width: 100%; margin-top: 20px"
        v-loading="loading"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="nickname" label="昵称" width="150">
          <template #default="{ row }">
            <div style="display: flex; align-items: center; gap: 10px">
              <el-avatar :src="row.avatar" size="small" />
              <span>{{ row.nickname || '未设置' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="openid" label="OpenID" width="200" show-overflow-tooltip />
        <el-table-column label="二维码" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.qrcode_url" type="success">已上传</el-tag>
            <el-tag v-else type="info">未上传</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="二维码预览" width="150">
          <template #default="{ row }">
            <el-image
              v-if="row.qrcode_url"
              :src="row.qrcode_url"
              :preview-src-list="[row.qrcode_url]"
              fit="cover"
              style="width: 100px; height: 100px; border-radius: 4px; cursor: pointer"
            />
            <span v-else style="color: #999">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="注册时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleViewDetail(row)">查看详情</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 用户详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="用户详情"
      width="600px"
    >
      <div v-if="currentUser" class="user-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="用户ID">
            {{ currentUser.id }}
          </el-descriptions-item>
          <el-descriptions-item label="昵称">
            {{ currentUser.nickname || '未设置' }}
          </el-descriptions-item>
          <el-descriptions-item label="OpenID">
            {{ currentUser.openid }}
          </el-descriptions-item>
          <el-descriptions-item label="头像">
            <el-avatar :src="currentUser.avatar" size="large" />
          </el-descriptions-item>
          <el-descriptions-item label="二维码">
            <el-image
              v-if="currentUser.qrcode_url"
              :src="currentUser.qrcode_url"
              :preview-src-list="[currentUser.qrcode_url]"
              fit="cover"
              style="width: 200px; height: 200px; border-radius: 4px; cursor: pointer"
            />
            <span v-else>未上传</span>
          </el-descriptions-item>
          <el-descriptions-item label="注册时间">
            {{ formatTime(currentUser.created_at) }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'

const loading = ref(false)
const users = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const searchQuery = ref('')

const detailDialogVisible = ref(false)
const currentUser = ref(null)

// 加载用户列表
const loadUsers = async () => {
  loading.value = true
  try {
    const res = await request.get('/admin/users', {
      params: {
        page: currentPage.value,
        pageSize: pageSize.value,
        search: searchQuery.value
      }
    })
    users.value = res.data.list
    total.value = res.data.total
  } catch (error) {
    ElMessage.error('加载用户列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  loadUsers()
}

// 重置
const handleReset = () => {
  searchQuery.value = ''
  currentPage.value = 1
  loadUsers()
}

// 分页
const handleSizeChange = () => {
  currentPage.value = 1
  loadUsers()
}

const handleCurrentChange = () => {
  loadUsers()
}

// 查看详情
const handleViewDetail = (row) => {
  currentUser.value = row
  detailDialogVisible.value = true
}

// 删除用户
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户"${row.nickname || row.openid}"吗？删除后将同时删除该用户的所有提交记录，此操作不可恢复！`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    loading.value = true
    await request.delete(`/admin/users/${row.id}`)
    ElMessage.success('删除成功')
    loadUsers()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  } finally {
    loading.value = false
  }
}

// 格式化时间
const formatTime = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.users-container {
  padding: 0;
}

.header-card {
  margin-bottom: 20px;
}

.header-card h2 {
  margin: 0 0 10px 0;
  font-size: 24px;
  color: #333;
}

.subtitle {
  margin: 0;
  color: #999;
  font-size: 14px;
}

.table-card {
  min-height: calc(100vh - 200px);
}

.search-bar {
  display: flex;
  gap: 10px;
  align-items: center;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.user-detail {
  padding: 10px 0;
}
</style>
