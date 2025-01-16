import passport from 'passport'
import passportLocal from 'passport-local'
import User from './models/user.js'
import bcrypt from 'bcrypt'
import passportJWT from 'passport-jwt'
// import { StatusCodes } from 'http-status-codes'

// 用驗證策略去寫驗證方式
// 引用 passportLocal 驗證策略
// 編寫 login 驗證方式
// new 策略(設定, 完成後執行的function)
// (名字, 策略 , 方法)
passport.use(
  // 設定一個名稱為 login 的 Passport 本地驗證策略
  'login',
  new passportLocal.Strategy(
    {
      // 指定讀取的 req.body 的帳號欄位，預設是 username，改為 account
      usernameField: 'account',
      // 指定讀取的 req.body 的密碼欄位，預設是 password
      passwordField: 'password',
    },

    //   async (傳入的帳號, 傳入的密碼, done驗證完成後的回調函數) => {} 是策略的驗證函數，處理帳號與密碼驗證。
    async (account, password, done) => {
      try {
        // 查詢有沒有符合帳號的使用者，如果沒有找到直接拋出錯誤
        const user = await User.findOne({ account: account }).orFail(new Error('ACCOUNT'))
        // 檢查密碼 => (明文,祕文)
        if (!bcrypt.compareSync(password, user.password)) {
          throw new Error('PASSWORD')
        }
        // 完成驗證方式，將資料帶入下一步處理
        // done(錯誤, 資料, info)
        return done(null, user, null)
      } catch (error) {
        console.log(error)
        if (error.message === 'ACCOUNT') {
          return done(null, null, { message: 'userNotFound' })
        } else if (error.message === 'PASSWORD') {
          return done(null, null, { message: 'userPasswordIncorrect' })
        } else {
          return done(null, null, { message: 'serverError' })
        }
      }
    },
  ),
)

// 引用 passportJWT 驗證策略
// 編寫 jwt 驗證方式(登入後的再驗證)
passport.use(
  'jwt',
  new passportJWT.Strategy(
    {
      // jwt 位置
      jwtFromRequest: passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken(),
      // secret (env jwt，看有沒有被改過)
      secretOrKey: process.env.JWT_SECRET,
      // 讓後面的 function 能使用 req
      passReqToCallback: true,
      // 允許過期的 jwt 通過
      ignoreExpiration: true,
    },
    // req = 請求資訊，有設定 passReqToCallback 才能用
    // payload = 解碼後的資料
    // done = 下一步
    // 策略成功才會執行
    async (req, payload, done) => {
      try {
        // 因為沒有提供原始的 jwt，所以利用套件語法取得
        // const token = req.headers.authorization.split(' ')[1]  ------這是自己寫
        const token = passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken()(req)

        // 手動檢查過期
        // => 判斷網址 => 過期&網址不是我要的 => 拋出 token 錯誤
        // 只有 refresh 和 logout 允許過期的 jwt
        // payload.exp => jwt 過期時間，單位是秒
        // new Date().getTime() = 目前時間，單位是毫秒
        // 如果 payload.exp * 1000（過期時間）小於當前時間（new Date().getTime()），則代表 token 已過期。
        const expired = payload.exp * 1000 < new Date().getTime()
        // 請求路徑
        // (例子) http://localhost:4000/user/test?aaa=111&bbb=222
        // req.originUrl = /user/test?aaa=111&bbb=222
        // req.baseUrl = /user
        // req.path = /test
        // req.query = { aaa: 111, bbb: 222 }
        const url = req.baseUrl + req.path
        if (expired && url !== '/user/refresh' && url !== '/user/logout') {
          throw new Error('EXPIRED')
        }

        // 用解碼的資料查詢有沒有使用者( user 牽什麼取什麼)
        const user = await User.findById(payload._id).orFail(new Error('USER'))
        // 找到使用者後，檢查資料庫有沒有這個 jwt
        if (!user.tokens.includes(token)) {
          throw new Error('TOKEN')
        }
        // 都沒問題，下一步
        // done(錯誤, 資料, info)
        return done(null, { user, token }, null)
      } catch (error) {
        console.log(error)
        if (error.message === 'USER') {
          return done(null, null, { message: 'userNotFound' })
        } else if (error.message === 'TOKEN') {
          return done(null, null, { message: 'userTokenInvalid' })
        } else if (error.message === 'EXPIRED') {
          return done(null, null, { message: 'userTokenExpired' })
        } else {
          return done(null, null, { message: 'serverError' })
        }
      }
    },
  ),
)
