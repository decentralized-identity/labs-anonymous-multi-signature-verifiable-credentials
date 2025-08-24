import mongoose, { Schema, Document } from 'mongoose'
import { IIdentifier } from '@veramo/core'

// GroupDID Document Interface
export interface IGroupDIDDocument extends Document {
  did: string
  identifier: IIdentifier
  groupId: string
  createdAt: Date
  updatedAt: Date
}

// GroupConfig Document Interface
export interface IGroupConfigDocument extends Document {
  groupId: string
  name: string
  description: string
  merkleTreeDepth: number
  approvalPolicy: {
    m: number
    n: number
  }
  merkleRoot?: string
  members: string[]
  createdAt: Date
  updatedAt: Date
}

// GroupDID Schema
const GroupDIDSchema = new Schema<IGroupDIDDocument>({
  did: { type: String, required: true, unique: true, index: true },
  identifier: { type: Schema.Types.Mixed, required: true },
  groupId: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// GroupConfig Schema
const GroupConfigSchema = new Schema<IGroupConfigDocument>({
  groupId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  merkleTreeDepth: { type: Number, required: true },
  approvalPolicy: {
    m: { type: Number, required: true },
    n: { type: Number, required: true }
  },
  merkleRoot: { type: String },
  members: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// Create models
export const GroupDIDModel = mongoose.models.GroupDID || mongoose.model<IGroupDIDDocument>('GroupDID', GroupDIDSchema)
export const GroupConfigModel = mongoose.models.GroupConfig || mongoose.model<IGroupConfigDocument>('GroupConfig', GroupConfigSchema)