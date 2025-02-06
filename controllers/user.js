import User from '../models/user.js'
import Product from '../models/product.js'
import { StatusCodes } from 'http-status-codes'
import jwt from 'jsonwebtoken'
import validator from 'validator' //驗證

export const create = async (req, res) => {
  try {
    await User.create(req.body)
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
    })
  } catch (error) {
    console.log(error)
    if (error.name === 'MongoServerError' && error.code === 11000) {
      res.status(StatusCodes.CONFLICT).json({
        success: false,
        //  帳號重複
        message: 'userAccountDuplicate',
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
        //  未知錯誤
        message: 'serverError',
      })
    }
  }
}

// 簽一組 jwt 序號
// 簽 (sign) 一組 jwt 序號並存進資料庫，以及各種前端顯示
export const login = async (req, res) => {
  try {
    // jwt.sign (儲存資料, SECRET 驗證密鑰, {設定}) => 裡面不要放太複雜或機密資料
    // 1. jwt.sign({ _id: 使用了 middleware/auth.js/68 的物件 }
    // 2. SECRET 驗證密鑰 不能寫死，放在 .env 中
    // 3. 設定過期時間 ('5 s' 5秒過期測試)
    const token = jwt.sign({ _id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '7 days' })
    req.user.tokens.push(token)
    await req.user.save()
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      // 2. 登入後會收到以下東西 (再回到前端 src/pages/login)
      result: {
        token,
        account: req.user.account,
        role: req.user.role,
        cart: req.user.cartQuantity,
      },
    })
  } catch (error) {
    console.log(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'serverError',
    })
  }
}

export const profile = async (req, res) => {
  res.status(StatusCodes.OK).json({
    success: true,
    message: '',
    result: {
      account: req.user.account,
      role: req.user.role,
      cart: req.user.cartQuantity,
    },
  })
}

// 更新 jwt 驗證以延長過期 token
export const refresh = async (req, res) => {
  try {
    // 找索引 => 牽新的 => 換掉
    const idx = req.user.tokens.findIndex((token) => token === req.token)
    // sign 登出語法
    // const token = jwt.sign({ _id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '5 s' })
    const token = jwt.sign({ _id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '7 days' })
    req.user.tokens[idx] = token
    await req.user.save()
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: token,
    })
  } catch (error) {
    console.log(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'serverError',
    })
  }
}
// 登出
// 找陣列 => 找索引 => 登出不需要回應
export const logout = async (req, res) => {
  try {
    const idx = req.user.tokens.findIndex((token) => token === req.token)
    req.user.tokens.splice(idx, 1)
    await req.user.save()
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
    })
  } catch (error) {
    console.log(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'serverError',
    })
  }
}
// 購物車
// 這段程式碼的目的是根據使用者的 ID 查詢並返回該使用者的購物車資料，並且把包含商品資料的購物車傳回給客戶端。
export const getCart = async (req, res) => {
  try {
    const result = await User.findById(req.user._id, 'cart').populate('cart.product')
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: result.cart,
    })
    // 如果遇到錯誤，則返回 500 錯誤。
  } catch (error) {
    console.log(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'serverError',
    })
  }
}
// 更新
export const updateCart = async (req, res) => {
  try {
    // 檢查傳入的商品 ID 格式
    if (!validator.isMongoId(req.body.product)) throw new Error('ID')
    // 檢查購物車內有沒有商品
    const idx = req.user.cart.findIndex((item) => item.product.toString() === req.body.product)
    if (idx > -1) {
      // 有商品，修改數量
      const quantity = req.user.cart[idx].quantity + parseInt(req.body.quantity)
      if (quantity > 0) {
        // 修改後大於 0，修改數量
        req.user.cart[idx].quantity = quantity
      } else {
        // 修改後小於等於 0，刪除商品
        req.user.cart.splice(idx, 1)
      }
    } else {
      // 沒有商品，檢查商品是否存在
      const product = await Product.findById(req.body.product).orFail(new Error('NOT FOUND'))
      // 商品沒有上架，錯誤
      if (!product.sell) throw new Error('SELL')

      req.user.cart.push({ product: req.body.product, quantity: req.body.quantity })
    }

    await req.user.save()

    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: req.user.cartQuantity,
    })
  } catch (error) {
    console.log(error)
    if (error.name === 'CastError' || error.message === 'ID') {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'productIdInvalid',
      })
    } else if (error.message === 'NOT FOUND') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'productNotFound',
      })
    } else if (error.message === 'SELL') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'productNotOnSell',
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
        message: 'serverError',
      })
    }
  }
}
