import UserCollect from '../models/userCollect.js'
import Post from '../models/post.js'
import validator from 'validator' //驗證進來的 mongoDB ID 是否正確

import { StatusCodes } from 'http-status-codes'

// export const create = async (req, res) => {
//   try {
//     // 檢查
//     if (req.user.cart.length === 0) throw new Error('EMPTY')
//     // 檢查商品有沒有上架
//     const user = await User.findById(req.user._id, 'cart').populate('cart.product')
//     if (!user.cart.every((item) => item.product.sell)) throw new Error('SELL')
//     // 建立訂單
//     await UserCollect.create({
//       user: req.user._id,
//       cart: req.user.cart,
//     })
//     // 清空購物車
//     req.user.cart = []
//     await req.user.save()
//     res.status(StatusCodes.OK).json({
//       success: true,
//       message: '',
//     })
//   } catch (error) {
//     console.log(error)
//     if (error.message === 'EMPTY') {
//       res.status(StatusCodes.BAD_REQUEST).json({
//         success: false,
//         message: 'UserCollectCartEmpty',
//       })
//     } else if (error.message === 'SELL') {
//       res.status(StatusCodes.BAD_REQUEST).json({
//         success: false,
//         message: 'UserCollectProductNotSell',
//       })
//     } else if (error.name === 'ValidationError') {
//       const key = Object.keys(error.errors)[0]
//       res.status(StatusCodes.BAD_REQUEST).json({
//         success: false,
//         message: error.errors[key].message,
//       })
//     } else {
//       res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
//         success: false,
//         message: 'serverError',
//       })
//     }
//   }
// }

export const getCollected = async (req, res) => {
  try {
    const userId = req.user._id // 從 token 取得用戶 ID
    const userCollect = await UserCollect.findOne({ user: userId }).populate('postId')
    if (!userCollect || userCollect.postId.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '收藏清單不存在',
      })
    }

    console.log('收藏清單:', userCollect.postId) // 添加日誌檢查數據

    res.status(StatusCodes.OK).json({
      success: true,
      message: '收藏清單已取得',
      result: userCollect.postId,
    })
  } catch (error) {
    console.log(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'getCollected.伺服器錯誤',
    })
  }
}

// export const get = async (req, res) => {
//   try {
//     const result = await Post.find({ isPrivate: false })
//     res.status(StatusCodes.OK).json({
//       success: true,
//       message: '',
//       result,
//     })
//   } catch (error) {
//     console.log('controller post get', error)
//     res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
//       success: false,
//       message: 'serverError',
//     })
//   }
// }

export const updateCollected = async (req, res) => {
  try {
    if (!validator.isMongoId(req.body.post)) throw new Error('ID')
    const post = await Post.findById(req.body.post).orFail(new Error('NOT FOUND'))
    if (post.isPrivate) throw new Error('isPrivate')

    let userCollect = await UserCollect.findOne({ user: req.user._id })
    if (!userCollect) {
      userCollect = new UserCollect({ user: req.user._id, postId: [] })
    }

    const idx = userCollect.postId.findIndex((item) => item.toString() === req.body.post)
    // const user = await User.findById(req.user._id)

    if (idx > -1) {
      userCollect.postId.splice(idx, 1) // 移除收藏
    } else {
      userCollect.postId.push(req.body.post) // 添加收藏
    }
    await userCollect.save()

    // user.collected.push({ post: req.body.post })
    // await user.save()

    res.status(StatusCodes.OK).json({
      success: true,
      message: '收藏清單已更新',
      result: {
        userCollect: userCollect.postId,
      },
    })
  } catch (error) {
    console.log(error)
    if (error.name === 'CastError' || error.message === 'ID') {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '卡片 ID 錯誤',
      })
    } else if (error.message === 'NOT FOUND') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: '查無卡片',
      })
    } else if (error.message === 'isPrivate') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: '私人卡片',
      })
    } else if (error.name === 'ValidationError') {
      const key = Object.keys(error.errors)[0]
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: error.errors[key].message,
      })
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '伺服器錯誤',
      })
    }
  }
}
// export const getAll = async (req, res) => {
//   try {
//     const result = await UserCollect.find().populate('user', 'account').populate('cart.product')
//     res.status(StatusCodes.OK).json({
//       success: true,
//       message: '',
//       result,
//     })
//   } catch (error) {
//     console.log(error)
//     res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
//       success: false,
//       message: 'serverError',
//     })
//   }
// }
