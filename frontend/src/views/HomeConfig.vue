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
          <el-button type="primary" @click="handleSaveInstruction" :loading="saving">保存</el-button>
        </div>
      </template>

      <div class="editor-wrapper">
        <Toolbar
          :editor="editorRef"
          :defaultConfig="toolbarConfig"
          mode="default"
          class="toolbar"
        />
        <Editor
          v-model="instructionContent"
          :defaultConfig="editorConfig"
          mode="default"
          class="editor"
          @onCreated="handleCreated"
        />
      </div>

      <div class="editor-tips">
        <el-alert
          title="提示"
          type="info"
          :closable="false"
          show-icon
        >
          <p>• 使用富文本编辑器编辑使用说明,支持文本格式化、列表等功能</p>
          <p>• 支持直接粘贴图片(Ctrl+V),或点击工具栏图片按钮上传</p>
          <p>• 编辑完成后点击右上角"保存"按钮保存内容</p>
        </el-alert>
      </div>
    </el-card>

    <!-- 轮播图编辑对话框 -->
    <el-dialog
      v-model="bannerDialogVisible"
      :title="bannerForm.id ? '编辑轮播图' : '添加轮播图'"
      width="600px"
    >
      <el-form :model="bannerForm" label-width="100px">
        <el-form-item label="图片URL">
          <el-input v-model="bannerForm.content" placeholder="请输入图片URL(HTTPS)" />
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, shallowRef, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import '@wangeditor/editor/dist/css/style.css'
import { getHomeConfigs, addHomeConfig, updateHomeConfig, deleteHomeConfig, uploadImage } from '@/api/admin'

const configs = ref([])
const saving = ref(false)

// 轮播图数据
const banners = computed(() => {
  return configs.value.filter(item => item.type === 'banner')
})

// 使用说明数据 - 只取第一条
const instructionData = computed(() => {
  const list = configs.value.filter(item => item.type === 'instruction')
  return list.length > 0 ? list[0] : null
})

// 富文本编辑器
const editorRef = shallowRef()
const instructionContent = ref('')

const toolbarConfig = {
  excludeKeys: [
    'group-video',
    'insertTable',
    'codeBlock',
    'fullScreen'
  ]
}

const editorConfig = {
  placeholder: '请输入使用说明内容...',
  MENU_CONF: {
    // 配置上传图片
    uploadImage: {
      async customUpload(file, insertFn) {
        try {
          const res = await uploadImage(file)
          if (res.success) {
            // 插入图片到编辑器
            insertFn(res.data.url, file.name, res.data.url)
            ElMessage.success('图片上传成功')
          } else {
            ElMessage.error('图片上传失败')
          }
        } catch (error) {
          console.error('上传图片错误:', error)
          ElMessage.error('图片上传失败')
        }
      },
      // 单个文件的最大体积限制,默认为 2M
      maxFileSize: 5 * 1024 * 1024,
      // 最多可上传几个文件,默认为 100
      maxNumberOfFiles: 10,
      // 选择文件时的类型限制,默认为 ['image/*']
      allowedFileTypes: ['image/*'],
      // 自定义插入图片
      onInsertedImage(imageNode) {
        console.log('inserted image', imageNode)
      },
      // 自定义校验图片
      customBrowseAndUpload(insertFn) {
        // 这里不需要实现,使用默认的文件选择
      }
    }
  }
}

const handleCreated = (editor) => {
  editorRef.value = editor

  // 配置粘贴图片处理
  editor.on('paste', async (e) => {
    // 获取粘贴的数据
    const clipboardData = e.clipboardData || e.originalEvent?.clipboardData
    if (!clipboardData) return

    const items = clipboardData.items
    if (!items) return

    // 遍历粘贴的内容
    for (let i = 0; i < items.length; i++) {
      const item = items[i]

      // 如果是图片
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault() // 阻止默认粘贴行为

        const file = item.getAsFile()
        if (!file) continue

        try {
          // 上传图片
          const res = await uploadImage(file)
          if (res.success) {
            // 插入图片到编辑器
            const imageHtml = `<img src="${res.data.url}" alt="粘贴的图片" style="max-width: 100%;" />`
            editor.dangerouslyInsertHtml(imageHtml)
            ElMessage.success('图片上传成功')
          } else {
            ElMessage.error('图片上传失败')
          }
        } catch (error) {
          console.error('粘贴图片上传错误:', error)
          ElMessage.error('图片上传失败')
        }
      }
    }
  })
}

// 轮播图对话框
const bannerDialogVisible = ref(false)
const bannerForm = ref({
  id: null,
  type: 'banner',
  content: '',
  sort_order: 0,
  is_active: 1
})

// 加载数据
const loadData = async () => {
  try {
    const res = await getHomeConfigs()
    configs.value = res.data

    // 加载使用说明内容到编辑器
    if (instructionData.value) {
      instructionContent.value = instructionData.value.content || ''
    }
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
    if (!bannerForm.value.content) {
      ElMessage.warning('请输入图片URL')
      return
    }

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

// 保存使用说明
const handleSaveInstruction = async () => {
  try {
    saving.value = true

    if (!instructionContent.value || instructionContent.value === '<p><br></p>') {
      ElMessage.warning('请输入使用说明内容')
      return
    }

    const data = {
      type: 'instruction',
      content: instructionContent.value,
      sort_order: 0,
      is_active: 1
    }

    if (instructionData.value) {
      // 更新现有记录
      await updateHomeConfig(instructionData.value.id, data)
      ElMessage.success('使用说明更新成功')
    } else {
      // 创建新记录
      await addHomeConfig(data)
      ElMessage.success('使用说明保存成功')
    }

    loadData()
  } catch (error) {
    ElMessage.error(error.message || '保存失败')
  } finally {
    saving.value = false
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

// 组件销毁时销毁编辑器
onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor == null) return
  editor.destroy()
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

.editor-wrapper {
  border: 1px solid #ccc;
  border-radius: 4px;
  overflow: hidden;
}

.toolbar {
  border-bottom: 1px solid #ccc;
}

.editor {
  height: 500px;
  overflow-y: auto;
}

.editor-tips {
  margin-top: 20px;
}

.editor-tips p {
  margin: 5px 0;
  font-size: 14px;
}
</style>
