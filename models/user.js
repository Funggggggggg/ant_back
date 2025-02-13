// 引入套件
import { Schema, model, Error, ObjectId } from 'mongoose'
import validator from 'validator'
import bcrypt from 'bcrypt'
import UserRole from '../enums/UserRole.js'
// import UserCreated from '../models/UserCreated.js'
// import UserCollected from '../models/UserCollected.js'

const userSchema = new Schema(
  {
    account: {
      type: String,
      required: [true, '使用者帳號必填'],
      minlength: [4, '使用者帳號太短'],
      maxlength: [20, '使用者帳號太長'],
      unique: true,
      validate: {
        validator(value) {
          // 判斷是否為英數字
          return validator.isAlphanumeric(value)
        },
        message: '使用者帳號格式不符',
      },
    },
    password: {
      // 密碼驗證寫在別處，因為加密後會變很長
      type: String,
      required: [true, '使用者密碼必填'],
    },
    email: {
      type: String,
      required: [true, '使用者信箱必填'],
      unique: true,
      validate: {
        validator(value) {
          return validator.isEmail(value)
        },
        message: '使用者信箱格式不符',
      },
    },
    tokens: {
      type: [String],
      default: [],
    },
    role: {
      type: Number,
      default: UserRole.USER,
    },
    profile: {
      type: String,
    },
    introduce: {
      type: String,
    },
    created: {
      type: ObjectId,
      ref: 'UserCreated',
    },
    collected: [
      {
        post: {
          type: ObjectId,
          ref: 'posts',
          required: true,
        },
      },
    ],
    locked: {
      type: Boolean,
      default: false,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
)

// ⚡⚡訊息通知數 => 建立不存在的動態虛擬欄位
// 訊息通知: 追蹤/按讚/收藏才有東西，否則 0
// schema.virtual(欄位名稱).get(資料產生方式) => (翻 mongoose 檔案)
// 資料產生方式 function 內的 this 代表一筆資料
// userSchema.virtual('notiQuantity').get(function () {
//   const user = this
//   // reduce 是陣列的方法
//   // return user.cart.reduce((total, current) => {
//   //   return total + current.quantity
//   // }, 0) //0是指 total 的初始值
// })

// mongoose middleware(看官網)
// pre 是 mongoose 驗證後，存入資料庫前執行動作
// 保存之前 ---------> 驗證 ------(加密驗證)(next)-----> 存進去
userSchema.pre('save', function (next) {
  const user = this
  // 密碼欄位有修改再處理(避免二次加密)
  if (user.isModified('password')) {
    //自己寫錯誤驗證
    if (user.password.length < 4) {
      const error = new Error.ValidtionError()
      error.addError('password', new Error.ValidatorError({ message: '使用者密碼太短' }))
      //繼續進行下一步
      next(error)
    } else if (user.password.length > 20) {
      const error = new Error.ValidationError()
      error.addError('password', new Error.ValidatorError({ message: '使用者密碼太長' }))
      next(error)
    } else {
      // (10 是加鹽次數 => bcrypt 密碼學術語)
      user.password = bcrypt.hashSync(user.password, 10)
    }
  }
  next()
})

export default model('User', userSchema)
// 創建一個操作 "users" collection 的 Mongoose Model，它基於 userSchema 定義的結構。
