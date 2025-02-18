import User from '../models/user.js' // User 是自己取的 (匿名導出)
import Post from '../models/post.js'
import UserCollected from '../models/UserCollected.js'
import { StatusCodes } from 'http-status-codes'
import jwt from 'jsonwebtoken'
import validator from 'validator' //驗證

export const create = async (req, res) => {
  try {
    await User.create(req.body)
    console.log('333333333333', req.body)
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
    })
  } catch (error) {
    console.log(error)
    if (error.name === 'MongoServerError' && error.code === 11000) {
      res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: '使用者帳號重複',
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
        message: '伺服器錯誤',
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
        introduce: req.user.introduce || '', // 🛠 確保 introduce 有回傳，不為 undefined
        collected: req.user.collected || [],
        created: req.user.created || [],
        // collected: req.user.collectedQuantity,
      },
    })
  } catch (error) {
    console.log(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '伺服器錯誤',
    })
  }
}
// profile 是一個 後端 API（controllers/user.js），用來返回 使用者的基本資訊
export const profile = async (req, res) => {
  res.status(StatusCodes.OK).json({
    success: true,
    message: '',
    result: {
      account: req.user.account,
      introduce: req.user.introduce,
      role: req.user.role,
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
      message: '伺服器錯誤',
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
      message: '伺服器錯誤',
    })
  }
}

// 這段程式碼的目的是根據使用者的 ID 查詢並返回該使用者的收藏單資料，並且把包含卡片資料的收藏單傳回給客戶端。
export const getCollected = async (req, res) => {
  try {
    const userId = req.user._id
    const result = await User.findById(userId, 'collected').populate('collected.post')
    if (!result || result.collected.length === 0) {
      return res.status(404).json({
        success: false,
        message: '收藏清單不存在',
      })
    }
    // 返回收藏清單中的所有卡片資料
    res.status(200).json({
      success: true,
      message: '收藏清單已取得',
      result: result.collected,
    })
    // 如果遇到錯誤，則返回 500 錯誤。
  } catch (error) {
    console.log(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '伺服器錯誤',
    })
  }
}

// FIXME
// 更新收藏清單
export const updateCollected = async (req, res) => {
  try {
    // 檢查傳入的卡片 ID 格式
    if (!validator.isMongoId(req.body.post)) throw new Error('ID')
    // 檢查卡片是否存在
    const post = await Post.findById(req.body.post).orFail(new Error('NOT FOUND'))
    // 卡片是私人，錯誤
    if (post.isPrivate) throw new Error('isPrivate')

    // 查找使用者的收藏清單
    let userCollected = await UserCollected.findOne({ user: req.user._id })
    if (!userCollected) {
      // 如果使用者沒有收藏清單，創建一個新的
      userCollected = new UserCollected({ user: req.user._id, postId: [] })
    }

    // 檢查收藏單內有沒有卡片
    const idx = userCollected.postId.findIndex((item) => item.toString() === req.body.post)
    if (idx > -1) {
      // 卡片已經存在於收藏清單中，返回錯誤
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: '卡片已經存在於收藏清單中',
      })
    } else {
      // 沒有卡片，新增到收藏清單
      userCollected.postId.push(req.body.post)
    }
    await userCollected.save()

    res.status(StatusCodes.OK).json({
      success: true,
      message: '收藏清單已更新',
      result: userCollected.postId,
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
