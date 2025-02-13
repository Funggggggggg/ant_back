import { Router } from 'express'
// import { create, login } from '../controllers/user.js'
import * as user from '../controllers/user.js'
import * as auth from '../middlewares/auth.js'
// import { getCollected, updateCollected } from '../controllers/user.js'

const router = Router()

router.post('/', user.create)
// 路徑->步驟一->步驟一
router.post('/login', auth.login, user.login)
// router.post('/', create)
// router.post('/login', auth.login, login)
router.get('/profile', auth.jwt, user.profile)
router.patch('/refresh', auth.jwt, user.refresh) // 舊換新
router.delete('/logout', auth.jwt, user.logout) // 登出
router.get('/collected', auth.jwt, user.getCollected) // 獲取使用者收藏清單
router.patch('/collected', auth.jwt, user.updateCollected) // 更新使用者收藏清單

export default router
