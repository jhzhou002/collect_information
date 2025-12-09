<template>
  <div class="submissions">
    <h2 class="page-title">提交记录</h2>

    <!-- 筛选区域 -->
    <el-card class="filter-card" shadow="never">
      <el-form :model="queryParams" inline>
        <el-form-item label="结算状态">
          <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="全部" value="" />
            <el-option label="未结算" value="未结算" />
            <el-option label="已结算" value="已结算" />
          </el-select>
        </el-form-item>

        <el-form-item label="时间范围">
          <el-date-picker
            v-model="timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 380px"
          />
        </el-form-item>

        <el-form-item label="用户昵称">
          <el-input
            v-model="queryParams.nickname"
            placeholder="请输入昵称"
            clearable
            style="width: 200px"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
          <el-dropdown @command="handleExportCommand">
            <el-button type="success" :icon="Download">
              导出<el-icon class="el-icon--right"><arrow-down /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="excel">导出为 Excel</el-dropdown-item>
                <el-dropdown-item command="html">导出为 HTML</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 批量操作 -->
    <div v-if="selectedIds.length > 0" class="batch-actions">
      <el-button type="primary" size="small" @click="handleBatchStatus('已结算')">
        批量标记为已结算
      </el-button>
      <el-button type="warning" size="small" @click="handleBatchStatus('未结算')">
        批量标记为未结算
      </el-button>
      <span class="selected-count">已选择 {{ selectedIds.length }} 条</span>
    </div>

    <!-- 数据表格 -->
    <el-card class="table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="tableData"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />

        <el-table-column label="用户昵称" prop="submit_nickname" min-width="120" />

        <el-table-column label="二维码" width="120">
          <template #default="{ row }">
            <el-image
              v-if="row.qrcode_url"
              :src="row.qrcode_url"
              :preview-src-list="[row.qrcode_url]"
              fit="cover"
              style="width: 60px; height: 60px; cursor: pointer"
            />
            <span v-else class="no-qrcode">未上传</span>
          </template>
        </el-table-column>

        <el-table-column label="链接数量" prop="link_count" width="100" align="center" />

        <el-table-column label="提交时间" prop="created_at" width="180">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>

        <el-table-column label="结算状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === '已结算' ? 'success' : 'warning'">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="备注" min-width="150">
          <template #default="{ row }">
            <div class="remark-cell">
              <span class="remark-text">{{ row.remark || '-' }}</span>
              <el-button
                type="primary"
                link
                size="small"
                :icon="Edit"
                @click="handleEditRemark(row)"
              >
                编辑
              </el-button>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleViewDetail(row)">
              查看详情
            </el-button>
            <el-button
              v-if="row.status === '未结算'"
              type="success"
              link
              size="small"
              @click="handleChangeStatus(row, '已结算')"
            >
              标记已结算
            </el-button>
            <el-button
              v-else
              type="warning"
              link
              size="small"
              @click="handleChangeStatus(row, '未结算')"
            >
              标记未结算
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailVisible" title="提交详情" width="600px">
      <div v-if="currentDetail" class="detail-content">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="用户昵称">
            {{ currentDetail.submit_nickname }}
          </el-descriptions-item>
          <el-descriptions-item label="提交时间">
            {{ formatTime(currentDetail.created_at) }}
          </el-descriptions-item>
          <el-descriptions-item label="链接数量">
            {{ currentDetail.link_count }}
          </el-descriptions-item>
          <el-descriptions-item label="结算状态">
            <el-tag :type="currentDetail.status === '已结算' ? 'success' : 'warning'">
              {{ currentDetail.status }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="备注">
            {{ currentDetail.remark || '-' }}
          </el-descriptions-item>
        </el-descriptions>

        <h4 style="margin-top: 20px">链接列表：</h4>
        <div class="links-list">
          <div
            v-for="(link, index) in currentDetail.links"
            :key="index"
            class="link-item"
          >
            <span class="link-index">{{ index + 1 }}.</span>
            <el-link :href="link" target="_blank" type="primary">
              {{ link }}
            </el-link>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 编辑备注对话框 -->
    <el-dialog v-model="remarkVisible" title="编辑备注" width="500px">
      <el-input
        v-model="remarkForm.remark"
        type="textarea"
        :rows="4"
        placeholder="请输入备注"
        maxlength="500"
        show-word-limit
      />
      <template #footer>
        <el-button @click="remarkVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveRemark">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Download, Edit, ArrowDown } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import {
  getSubmissions,
  getSubmissionDetail,
  updateStatus,
  batchUpdateStatus,
  updateRemark,
  exportExcel,
  exportHtml
} from '../api/admin'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const timeRange = ref([])
const selectedIds = ref([])

const queryParams = reactive({
  page: 1,
  pageSize: 20,
  status: '',
  startTime: '',
  endTime: '',
  nickname: ''
})

// 详情对话框
const detailVisible = ref(false)
const currentDetail = ref(null)

// 备注对话框
const remarkVisible = ref(false)
const remarkForm = reactive({
  id: null,
  remark: ''
})

// 加载数据
const loadData = async () => {
  loading.value = true

  try {
    // 处理时间范围
    if (timeRange.value && timeRange.value.length === 2) {
      queryParams.startTime = timeRange.value[0]
      queryParams.endTime = timeRange.value[1]
    } else {
      queryParams.startTime = ''
      queryParams.endTime = ''
    }

    const res = await getSubmissions(queryParams)
    tableData.value = res.data.list
    total.value = res.data.total
  } catch (error) {
    console.error('加载数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 查询
const handleSearch = () => {
  queryParams.page = 1
  loadData()
}

// 重置
const handleReset = () => {
  queryParams.page = 1
  queryParams.pageSize = 20
  queryParams.status = ''
  queryParams.nickname = ''
  timeRange.value = []
  loadData()
}

// 导出命令处理
const handleExportCommand = (command) => {
  if (command === 'excel') {
    handleExportExcel()
  } else if (command === 'html') {
    handleExportHtml()
  }
}

// 导出Excel
const handleExportExcel = async () => {
  try {
    // 处理时间范围
    const exportParams = { ...queryParams }
    if (timeRange.value && timeRange.value.length === 2) {
      exportParams.startTime = timeRange.value[0]
      exportParams.endTime = timeRange.value[1]
    }

    const res = await exportExcel(exportParams)

    // 下载文件
    const blob = new Blob([res.data])
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `提交记录_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)

    ElMessage.success('导出Excel成功')
  } catch (error) {
    console.error('导出Excel失败:', error)
    ElMessage.error('导出Excel失败')
  }
}

// 导出HTML
const handleExportHtml = async () => {
  try {
    // 处理时间范围
    const exportParams = { ...queryParams }
    if (timeRange.value && timeRange.value.length === 2) {
      exportParams.startTime = timeRange.value[0]
      exportParams.endTime = timeRange.value[1]
    }

    const res = await exportHtml(exportParams)

    // 下载文件
    const blob = new Blob([res.data], { type: 'text/html' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `提交记录_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.html`
    link.click()
    window.URL.revokeObjectURL(url)

    ElMessage.success('导出HTML成功')
  } catch (error) {
    console.error('导出HTML失败:', error)
    ElMessage.error('导出HTML失败')
  }
}

// 查看详情
const handleViewDetail = async (row) => {
  try {
    const res = await getSubmissionDetail(row.id)
    currentDetail.value = res.data
    detailVisible.value = true
  } catch (error) {
    console.error('获取详情失败:', error)
  }
}

// 更改状态
const handleChangeStatus = async (row, status) => {
  try {
    await updateStatus(row.id, status)
    ElMessage.success('状态更新成功')
    loadData()
  } catch (error) {
    console.error('更新状态失败:', error)
  }
}

// 批量更改状态
const handleBatchStatus = async (status) => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择记录')
    return
  }

  try {
    await ElMessageBox.confirm(`确定要批量标记为${status}吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await batchUpdateStatus(selectedIds.value, status)
    ElMessage.success('批量更新成功')
    selectedIds.value = []
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量更新失败:', error)
    }
  }
}

// 编辑备注
const handleEditRemark = (row) => {
  remarkForm.id = row.id
  remarkForm.remark = row.remark || ''
  remarkVisible.value = true
}

// 保存备注
const handleSaveRemark = async () => {
  try {
    await updateRemark(remarkForm.id, remarkForm.remark)
    ElMessage.success('备注保存成功')
    remarkVisible.value = false
    loadData()
  } catch (error) {
    console.error('保存备注失败:', error)
  }
}

// 选择变化
const handleSelectionChange = (selection) => {
  selectedIds.value = selection.map(item => item.id)
}

// 格式化时间
const formatTime = (time) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.submissions {
  padding: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #333;
}

.filter-card {
  margin-bottom: 20px;
}

.batch-actions {
  margin-bottom: 20px;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.selected-count {
  color: #666;
  font-size: 14px;
  margin-left: auto;
}

.table-card {
  margin-bottom: 20px;
}

.no-qrcode {
  color: #999;
  font-size: 12px;
}

.remark-cell {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.remark-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.detail-content {
  padding: 10px 0;
}

.links-list {
  margin-top: 10px;
}

.link-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.link-item:last-child {
  border-bottom: none;
}

.link-index {
  color: #999;
  font-size: 14px;
  min-width: 30px;
}
</style>
