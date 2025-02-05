import { Router } from 'express'
import { create } from '../controllers/user.js'

const routerPost = Router()

routerPost.post('/', create)

export default routerPost
