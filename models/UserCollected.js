import { Schema, ObjectId, model } from 'mongoose'

const UserCollectedSchema = new Schema({
  user: {
    type: ObjectId,
    ref: 'User',
    required: true,
  },
  postId: {
    type: [ObjectId],
    ref: 'Post',
    required: true,
  },
})

export default model('UserCollected', UserCollectedSchema)
