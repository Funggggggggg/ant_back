import { Router } from 'express'
// import { create, login } from '../controllers/user.js'
import * as user from '../controllers/user.js'
import * as auth from '../middlewares/auth.js'

const router = Router()

router.post('/', user.create)
// 路徑->步驟一->步驟一
router.post('/login', auth.login, user.login)
// router.post('/', create)
// router.post('/login', auth.login, login)
router.get('/profile', auth.jwt, user.profile)
router.patch('/refresh', auth.jwt, user.refresh) // 舊換新
router.delete('/logout', auth.jwt, user.logout) // 登出
router.get('/cart', auth.jwt, user.getCart) // 取使用者購物車
router.patch('/cart', auth.jwt, user.updateCart) // 修改/更新購物車

export default router
