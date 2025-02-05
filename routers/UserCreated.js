import { Router } from 'express'
import { create } from '../controllers/user.js'

const routerUsercreated = Router()

routerUsercreated.post('/', create)

export default routerUsercreated
