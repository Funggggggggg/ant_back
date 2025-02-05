import { Schema, ObjectId } from 'mongoose'

const UserCollectedSchema = new Schema({
  user: {
    type: ObjectId,
    ref: 'users',
    required: true,
  },
  postId: {
    type: [ObjectId],
    ref: 'post',
    required: true,
  },
})

export default UserCollectedSchema
