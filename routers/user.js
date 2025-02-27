import { Router } from 'express'
import * as user from '../controllers/user.js'
import * as auth from '../middlewares/auth.js'
// import { create, login } from '../controllers/user.js'
// import { getCollected, updateCollected } from '../controllers/user.js'

const router = Router()

// 使用者註冊與登入
router.post('/', user.create)
router.post('/login', auth.login, user.login)

// 使用者資料相關
router.get('/profile', auth.jwt, user.profile)
// router.get('/:id', auth.jwt, user.getUserById) // 根據用戶 ID 獲取特定用戶的資料
router.patch('/refresh', auth.jwt, user.refresh) // 舊換新
router.delete('/logout', auth.jwt, user.logout) // 登出

// 收藏文章相關
// router.get('/collected', auth.jwt, user.getCollected) // 獲取使用者收藏清單
// router.patch('/collected', auth.jwt, user.updateCollected) // 更新使用者收藏清單

export default router
