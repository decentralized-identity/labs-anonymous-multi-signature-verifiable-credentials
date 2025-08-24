import mongoose, { Document } from 'mongoose';
import { IIdentifier } from '@veramo/core';
export interface IGroupDIDDocument extends Document {
    did: string;
    identifier: IIdentifier;
    groupId: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface IGroupConfigDocument extends Document {
    groupId: string;
    name: string;
    description: string;
    merkleTreeDepth: number;
    approvalPolicy: {
        m: number;
        n: number;
    };
    merkleRoot?: string;
    members: string[];
    createdAt: Date;
    updatedAt: Date;
}
export declare const GroupDIDModel: mongoose.Model<any, {}, {}, {}, any, any> | mongoose.Model<IGroupDIDDocument, {}, {}, {}, mongoose.Document<unknown, {}, IGroupDIDDocument, {}, {}> & IGroupDIDDocument & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export declare const GroupConfigModel: mongoose.Model<any, {}, {}, {}, any, any> | mongoose.Model<IGroupConfigDocument, {}, {}, {}, mongoose.Document<unknown, {}, IGroupConfigDocument, {}, {}> & IGroupConfigDocument & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
