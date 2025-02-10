import { Schema, model } from 'mongoose'

const postSchema = new Schema(
  {
    user: {
      type: Object,
      required: [true, '使用者帳號必填'],
    },
    title: {
      type: String,
      required: [true, '標題必填'],
    },
    category: {
      type: String,
      required: [true, '分類必填'],
      enum: {
        values: ['紀念繪畫', '回憶拼貼', '故事攝影', '物品改造', '其他'],
        message: '分類不符',
      },
    },
    content: {
      type: String,
      required: [true, '說明必填'],
    },
    image: {
      type: String,
      required: [true, '圖片必填'],
    },
    isPrivate: {
      type: Boolean,
      default: false,
      //required: [true, '私人或公開必填'],
    },
    createdAt: {
      type: Date,
    },
    updatedAt: {
      type: Date,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
)

export default model('postings', postSchema)
