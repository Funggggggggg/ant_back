import { Schema, ObjectId, model } from 'mongoose'

const UserCollectedSchema = new Schema({
  user: {
    type: ObjectId,
    ref: 'user',
    required: true,
  },
  postId: {
    type: [ObjectId],
    ref: 'posts',
    required: true,
  },
})

export default model('UserCollected', UserCollectedSchema)
