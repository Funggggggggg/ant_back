import { Schema, ObjectId } from 'mongoose'

const UserCreatedSchema = new Schema({
  user: {
    type: ObjectId,
    ref: 'user',
    required: true,
  },
  postId: {
    type: ObjectId,
    ref: 'posts',
    required: true,
  },
})

export default UserCreatedSchema
