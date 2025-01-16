import { Router } from 'express'
import * as order from '../controllers/order.js'
import * as auth from '../middlewares/auth.js'

const router = Router()

// POST /: 用來創建訂單，需經過 JWT 驗證。
// GET /: 用來獲取訂單資料，需經過 JWT 驗證。
// GET /all: 用來獲取所有訂單資料，除了 JWT 驗證外，還需要管理員權限才能訪問。
router.post('/', auth.jwt, order.create)
router.get('/', auth.jwt, order.get)
router.get('/all', auth.jwt, auth.admin, order.getAll)

export default router
