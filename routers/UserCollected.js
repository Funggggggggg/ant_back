import { Router } from 'express'
import { create } from '../controllers/user.js'

const routerUsercollected = Router()

routerUsercollected.post('/', create)

export default routerUsercollected
