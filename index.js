import 'dotenv/config'
import express from 'express'
import mongoose from 'mongoose'
import { StatusCodes } from 'http-status-codes'
import routerUser from './routers/user.js'
import routerProduct from './routers/product.js'
import routerOrder from './routers/order.js'
import cors from 'cors' //搭配 express 處理跨域請求設定
import './passport.js'

mongoose
  .connect(process.env.DB_URL)
  .then(() => {
    console.log('資料庫連線成功')
    mongoose.set('sanitizeFilter', true)
  })
  .catch((error) => {
    console.log('資料庫連線失敗')
    console.log(error)
  })

const app = express()

app.use(cors()) //允許所有跨網域的請求

// 進階寫法
// app.use(
//   // cors 做跨域請求設定(前後網域不同)
//   cors({
//     // origin = 請求來源網域
//     // callback(錯誤, 是否允許通過)
//     origin(origin, callback) {
//       console.log(origin)
//       if (
//         // postman 的 origin 預設是 undefined
//         origin === undefined ||
//         origin.includes('localhost') ||
//         origin.includes('127.0.0.1') ||
//         origin.includes('github.io')
//       ) {
//         callback(null, true)
//       } else {
//         callback(new Error('CORS'), false)
//       }
//     },
//   }),
// )

app.use(express.json())
app.use((error, req, res, next) => {
  res.status(StatusCodes.BAD_REQUEST).json({
    success: false,
    message: 'requestFormatError',
  })
})

app.use('/user', routerUser)
app.use('/product', routerProduct)
app.use('/order', routerOrder)

app.listen(process.env.PORT || 4000, () => {
  console.log('伺服器啟動')
})
