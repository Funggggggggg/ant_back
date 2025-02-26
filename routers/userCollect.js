import { Router } from 'express'
import * as userCollect from '../controllers/userCollect.js'
import * as auth from '../middlewares/auth.js'

const router = Router()

// router.post('/collect', auth.jwt, userCollect.create) // 卡片收藏
router.get('/collect', auth.jwt, userCollect.getCollected) // 獲取用戶的收藏清單
router.patch('/uncollect', auth.jwt, userCollect.updateCollected) // 更新使用者收藏清單

export default router
