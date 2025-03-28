// import mongoose from 'mongoose'
import { StatusCodes } from 'http-status-codes'
import Post from '../models/post.js'
import validator from 'validator'
// import User from '../models/user.js'

export const create = async (req, res) => {
  // console.log('222222222222', req.body)
  try {
    req.body.image = req.file.path || ''
    const result = await Post.create(req.body)
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result,
    })
  } catch (error) {
    console.log('controller post create', error)
    if (error.name === 'ValidationError') {
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

// get & getAll 一模一樣，差在 Post.find({ isPrivate: false }) => 限制只有上架的商品
export const get = async (req, res) => {
  try {
    const result = await Post.find({ isPrivate: false })
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result,
    })
  } catch (error) {
    console.log('controller post get', error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'serverError',
    })
  }
}

export const getAll = async (req, res) => {
  try {
    const result = await Post.find()
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result,
    })
  } catch (error) {
    console.log('controller post getAll', error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'serverError',
    })
  }
}

export const getUserAllPosts = async (req, res) => {
  try {
    const userId = req.params.id
    console.log(req.params.id)

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '用戶 ID 未提供',
      })
    }

    // 確保 userId 是 ObjectId
    if (!validator.isMongoId(userId)) {
      return res.status(400).json({
        success: false,
        message: '無效的用戶 ID',
      })
    }

    // 直接透過用戶 ID 查詢文章
    const result = await Post.find({ user: userId }).populate('user', 'account email introduce')
    console.log('取得的文章:', result)
    if (!result || result.length === 0) {
      return res.status(404).json({
        success: false,
        message: '該用戶尚未發表任何文章',
      })
    }

    res.status(200).json({
      success: true,
      message: '已成功獲取用戶文章',
      result,
    })
  } catch (error) {
    console.log('getUserAllPosts 錯誤:', error)
    res.status(500).json({
      success: false,
      message: '伺服器錯誤，無法獲取用戶文章',
    })
  }
}

export const getId = async (req, res) => {
  try {
    if (!validator.isMongoId(req.params.id)) throw new Error('ID')
    const result = await Post.findById(req.params.id).orFail(new Error('NOT FOUND'))
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result,
    })
  } catch (error) {
    console.log('controller post getId', error)
    if (error.name === 'CastError' || error.message === 'ID') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'postIdInvalid',
      })
    } else if (error.message === 'NOT FOUND') {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'postNotFound',
      })
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'serverError',
      })
    }
  }
}

export const edit = async (req, res) => {
  // console.log(req.params.id)
  // console.log('111111111111', req.body)
  try {
    if (!validator.isMongoId(req.params.id)) throw new Error('ID')

    // 不需要空集合'' 沒換圖的表單問題，圖片會變成空的文字
    req.body.image = req.file?.path
    const result = await Post.findByIdAndUpdate(req.params.id, req.body, {
      runValidators: true,
      new: true,
    }).orFail(new Error('NOT FOUND'))

    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result,
    })
  } catch (error) {
    console.log(error)
    // CastError 通常是指將一個無效的資料型態（例如字串）轉換為其他型態時發生的錯誤，常見於 MongoDB 中，當試圖將非數字的資料轉換為 ObjectId 時就會發生。
    if (error.name === 'CastError' || error.message === 'ID') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'postIdInvalid',
      })
    } else if (error.message === 'NOT FOUND') {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'postNotFound',
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
