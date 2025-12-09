<template>
  <div class="home-config">
    <el-card class="header-card">
      <h2>首页配置管理</h2>
      <p class="subtitle">管理小程序首页的轮播图和使用说明</p>
    </el-card>

    <!-- 轮播图管理 -->
    <el-card class="section-card">
      <template #header>
        <div class="card-header">
          <span class="title">📱 轮播图管理</span>
          <el-button type="primary" @click="handleAddBanner">添加轮播图</el-button>
        </div>
      </template>

      <el-table :data="banners" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="图片预览" width="200">
          <template #default="{ row }">
            <el-image
              :src="row.content"
              :preview-src-list="[row.content]"
              fit="cover"
              style="width: 150px; height: 75px; border-radius: 4px;"
            />
          </template>
        </el-table-column>
        <el-table-column prop="content" label="图片URL" show-overflow-tooltip />
        <el-table-column prop="sort_order" label="排序" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'">
              {{ row.is_active ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleEditBanner(row)">编辑</el-button>
            <el-button
              size="small"
              :type="row.is_active ? 'warning' : 'success'"
              @click="handleToggleStatus(row)"
            >
              {{ row.is_active ? '禁用' : '启用' }}
            </el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 使用说明管理 -->
    <el-card class="section-card">
      <template #header>
        <div class="card-header">
          <span class="title">📌 使用说明管理</span>
          <el-button type="primary" @click="handleAddInstruction">添加说明</el-button>
        </div>
      </template>

      <el-table :data="instructions" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="content" label="说明内容" />
        <el-table-column prop="sort_order" label="排序" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'">
              {{ row.is_active ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleEditInstruction(row)">编辑</el-button>
            <el-button
              size="small"
              :type="row.is_active ? 'warning' : 'success'"
              @click="handleToggleStatus(row)"
            >
              {{ row.is_active ? '禁用' : '启用' }}
            </el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 轮播图编辑对话框 -->
    <el-dialog
      v-model="bannerDialogVisible"
      :title="bannerForm.id ? '编辑轮播图' : '添加轮播图'"
      width="600px"
    >
      <el-form :model="bannerForm" label-width="100px">
        <el-form-item label="图片URL">
          <el-input v-model="bannerForm.content" placeholder="请输入图片URL" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="bannerForm.sort_order" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch
            v-model="bannerForm.is_active"
            :active-value="1"
            :inactive-value="0"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="bannerDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveBanner">保存</el-button>
      </template>
    </el-dialog>

    <!-- 使用说明编辑对话框 -->
    <el-dialog
      v-model="instructionDialogVisible"
      :title="instructionForm.id ? '编辑使用说明' : '添加使用说明'"
      width="600px"
    >
      <el-form :model="instructionForm" label-width="100px">
        <el-form-item label="说明内容">
          <el-input
            v-model="instructionForm.content"
            type="textarea"
            :rows="3"
            placeholder="请输入使用说明"
          />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="instructionForm.sort_order" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch
            v-model="instructionForm.is_active"
            :active-value="1"
            :inactive-value="0"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="instructionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveInstruction">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getHomeConfigs, addHomeConfig, updateHomeConfig, deleteHomeConfig } from '@/api/admin'

const configs = ref([])

// 轮播图数据
const banners = computed(() => {
  return configs.value.filter(item => item.type === 'banner')
})

// 使用说明数据
const instructions = computed(() => {
  return configs.value.filter(item => item.type === 'instruction')
})

// 轮播图对话框
const bannerDialogVisible = ref(false)
const bannerForm = ref({
  id: null,
  type: 'banner',
  content: '',
  sort_order: 0,
  is_active: 1
})

// 使用说明对话框
const instructionDialogVisible = ref(false)
const instructionForm = ref({
  id: null,
  type: 'instruction',
  content: '',
  sort_order: 0,
  is_active: 1
})

// 加载数据
const loadData = async () => {
  try {
    const res = await getHomeConfigs()
    configs.value = res.data
  } catch (error) {
    ElMessage.error('加载数据失败')
  }
}

// 添加轮播图
const handleAddBanner = () => {
  bannerForm.value = {
    id: null,
    type: 'banner',
    content: '',
    sort_order: banners.value.length + 1,
    is_active: 1
  }
  bannerDialogVisible.value = true
}

// 编辑轮播图
const handleEditBanner = (row) => {
  bannerForm.value = { ...row }
  bannerDialogVisible.value = true
}

// 保存轮播图
const handleSaveBanner = async () => {
  try {
    if (bannerForm.value.id) {
      // 更新
      await updateHomeConfig(bannerForm.value.id, bannerForm.value)
      ElMessage.success('更新成功')
    } else {
      // 添加
      await addHomeConfig(bannerForm.value)
      ElMessage.success('添加成功')
    }
    bannerDialogVisible.value = false
    loadData()
  } catch (error) {
    ElMessage.error(error.message || '保存失败')
  }
}

// 添加使用说明
const handleAddInstruction = () => {
  instructionForm.value = {
    id: null,
    type: 'instruction',
    content: '',
    sort_order: instructions.value.length + 1,
    is_active: 1
  }
  instructionDialogVisible.value = true
}

// 编辑使用说明
const handleEditInstruction = (row) => {
  instructionForm.value = { ...row }
  instructionDialogVisible.value = true
}

// 保存使用说明
const handleSaveInstruction = async () => {
  try {
    if (instructionForm.value.id) {
      // 更新
      await updateHomeConfig(instructionForm.value.id, instructionForm.value)
      ElMessage.success('更新成功')
    } else {
      // 添加
      await addHomeConfig(instructionForm.value)
      ElMessage.success('添加成功')
    }
    instructionDialogVisible.value = false
    loadData()
  } catch (error) {
    ElMessage.error(error.message || '保存失败')
  }
}

// 切换状态
const handleToggleStatus = async (row) => {
  try {
    await updateHomeConfig(row.id, {
      is_active: row.is_active ? 0 : 1
    })
    ElMessage.success('状态更新成功')
    loadData()
  } catch (error) {
    ElMessage.error('状态更新失败')
  }
}

// 删除
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除这条配置吗？', '提示', {
      type: 'warning'
    })
    await deleteHomeConfig(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.home-config {
  padding: 20px;
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

.section-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header .title {
  font-size: 18px;
  font-weight: bold;
}
</style>
