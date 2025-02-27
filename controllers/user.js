import User from '../models/user.js'
import { StatusCodes } from 'http-status-codes'
import jwt from 'jsonwebtoken'

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
        message: '伺服器錯誤',
      })
    }
  }
}

export const login = async (req, res) => {
  try {
    const token = jwt.sign({ _id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '7 days' })
    req.user.tokens.push(token)
    await req.user.save()
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: {
        token,
        account: req.user.account,
        role: req.user.role,
        introduce: req.user.introduce || '',
        // collected: req.user.collected || [],
        // created: req.user.created || [],
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

export const profile = async (req, res) => {
  try {
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: {
        _id: req.user._id, // 🟢 補上 _id
        account: req.user.account,
        email: req.user.email,
        role: req.user.role,
        introduce: req.user.introduce || '',
        // collected: req.user.collected || [],
        // created: req.user.created || [],
      },
    })
  } catch (error) {
    console.log('Profile 錯誤:', error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '伺服器錯誤',
    })
  }
}

export const refresh = async (req, res) => {
  try {
    const idx = req.user.tokens.findIndex((token) => token === req.token)
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

// 根據用戶 ID 獲取特定用戶的資料
// export const getUserById = async (req, res) => {
//   try {
//     const user = await User.findById(req.params.id).select('-password') // 不返回密碼
//     if (!user) {
//       return res.status(404).json({ message: '用戶不存在' })
//     }
//     res.json({ result: user })
//   } catch (error) {
//     res.status(500).json({ message: '伺服器錯誤' })
//     console.error(error)
//   }
// }

// export const updateCollected = async (req, res) => {
//   try {
//     if (!validator.isMongoId(req.body.post)) throw new Error('ID')
//     const post = await Post.findById(req.body.post).orFail(new Error('NOT FOUND'))
//     if (post.isPrivate) throw new Error('isPrivate')

//     let userCollect = await UserCollect.findOne({ user: req.user._id })
//     if (!userCollect) {
//       userCollect = new UserCollect({ user: req.user._id, postId: [] })
//     }

//     const idx = userCollect.postId.findIndex((item) => item.toString() === req.body.post)
//     // const user = await User.findById(req.user._id)

//     if (idx > -1) {
//       userCollect.postId.splice(idx, 1) // 移除收藏
//     } else {
//       userCollect.postId.push(req.body.post) // 添加收藏
//     }
//     await userCollect.save()

//     // user.collected.push({ post: req.body.post })
//     // await user.save()

//     res.status(StatusCodes.OK).json({
//       success: true,
//       message: '收藏清單已更新',
//       result: {
//         userCollect: userCollect.postId,
//       },
//     })
//   } catch (error) {
//     console.log(error)
//     if (error.name === 'CastError' || error.message === 'ID') {
//       res.status(StatusCodes.NOT_FOUND).json({
//         success: false,
//         message: '卡片 ID 錯誤',
//       })
//     } else if (error.message === 'NOT FOUND') {
//       res.status(StatusCodes.BAD_REQUEST).json({
//         success: false,
//         message: '查無卡片',
//       })
//     } else if (error.message === 'isPrivate') {
//       res.status(StatusCodes.BAD_REQUEST).json({
//         success: false,
//         message: '私人卡片',
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
//         message: '伺服器錯誤',
//       })
//     }
//   }
// }
