import { Router } from 'express'
import * as post from '../controllers/post.js'
import * as auth from '../middlewares/auth.js'
import upload from '../middlewares/upload.js'

const router = Router()

// 先認證 jwt => 管理員 => 再新增
router.post('/', auth.jwt, auth.admin, upload, post.create)
// 這三行順序有差
router.get('/', post.get) //沒登入者
router.get('/all', auth.jwt, auth.admin, post.getAll) //給管理員看(包含沒上架的)
router.get('/:id', post.getId) //取單個商品
router.patch('/:id', auth.jwt, auth.admin, upload, post.edit) //編輯商品

export default router
