// 引入套件
import { Schema, model, ObjectId, Error } from 'mongoose'
import validator from 'validator'
import bcrypt from 'bcrypt'
import UserRole from '../enums/UserRole.js'

// 使用者欄位驗證
const cartSchema = new Schema({
  product: {
    type: ObjectId,
    ref: 'products',
    required: [true, 'userCartProductRequired'],
  },
  quantity: {
    type: Number,
    required: [true, 'userCartQuantityRequired'],
    min: [1, 'userCartQuantityTooSmall'],
  },
})

const schema = new Schema(
  {
    account: {
      type: String,
      required: [true, 'userAccountRequired'],
      minlength: [4, 'userAccountTooShort'],
      maxlength: [20, 'userAccountTooLong'],
      unique: true,
      validate: {
        validator(value) {
          // 判斷是否為英數字
          return validator.isAlphanumeric(value)
        },
        message: 'userAccountInvalid',
      },
    },
    password: {
      // 密碼驗證寫在別處，因為加密後會變很長
      type: String,
      required: [true, 'userPasswordRequired'],
    },
    email: {
      type: String,
      required: [true, 'userEmailRequired'],
      unique: true,
      validate: {
        validator(value) {
          return validator.isEmail(value)
        },
        message: 'userEmailInvalid',
      },
    },
    tokens: {
      type: [String],
    },
    role: {
      type: Number,
      default: UserRole.USER,
    },
    cart: {
      type: [cartSchema],
    },
    //   admin: {
    // 不一定是布林值
    // type: Boolean,
    // default: false,
    //   },
  },
  {
    versionKey: false,
    timestamps: true,
  },
)
// 用意: 購物車內有幾件商品
//  schema.virtual(欄位名稱).get(資料產生方式) => (翻 mongoose 檔案)
// 建立不存在的動態虛擬欄位 (cartQuantity)
// 資料產生方式 function 內的 this 代表一筆資料
schema.virtual('cartQuantity').get(function () {
  const user = this
  return user.cart.reduce((total, current) => {
    return total + current.quantity
  }, 0)
})

// mongoose middleware(看官網)
// pre 是 mongoose 驗證後，存入資料庫前執行動作
// 保存之前 ---------> 驗證 ------(加密驗證)(next)-----> 存進去
schema.pre('save', function (next) {
  const user = this
  // 密碼欄位有修改再處理(避免二次加密)
  if (user.isModified('password')) {
    //自己寫錯誤驗證
    if (user.password.length < 4) {
      const error = new Error.ValidtionError()
      error.addError('password', new Error.ValidatorError({ message: 'userPasswordTooShort' }))
      //繼續進行下一步
      next(error)
    } else if (user.password.length > 20) {
      const error = new Error.ValidationError()
      error.addError('password', new Error.ValidatorError({ message: 'userPasswordTooLong' }))
      next(error)
    } else {
      // (10 是加鹽次數 => bcrypt 密碼學術語)
      user.password = bcrypt.hashSync(user.password, 10)
    }
  }
  next()
})

export default model('users', schema)
