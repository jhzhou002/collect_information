import { defineStore } from 'pinia'
import { adminLogin } from '../api/auth'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('admin_token') || '',
    userInfo: JSON.parse(localStorage.getItem('admin_info') || '{}')
  }),

  getters: {
    isLoggedIn: (state) => !!state.token
  },

  actions: {
    // 登录
    async login(loginForm) {
      const res = await adminLogin(loginForm)
      const { token, admin } = res.data

      this.token = token
      this.userInfo = admin

      localStorage.setItem('admin_token', token)
      localStorage.setItem('admin_info', JSON.stringify(admin))

      return res
    },

    // 登出
    logout() {
      this.token = ''
      this.userInfo = {}
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_info')
    }
  }
})
