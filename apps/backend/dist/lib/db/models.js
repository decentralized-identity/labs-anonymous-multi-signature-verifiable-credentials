"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupConfigModel = exports.GroupDIDModel = void 0;
const mongoose_1 = require("mongoose");
const GroupDIDSchema = new mongoose_1.Schema({
    did: { type: String, required: true, unique: true, index: true },
    identifier: { type: mongoose_1.Schema.Types.Mixed, required: true },
    groupId: { type: String, required: true, index: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});
const GroupConfigSchema = new mongoose_1.Schema({
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
});
exports.GroupDIDModel = mongoose_1.default.models.GroupDID || mongoose_1.default.model('GroupDID', GroupDIDSchema);
exports.GroupConfigModel = mongoose_1.default.models.GroupConfig || mongoose_1.default.model('GroupConfig', GroupConfigSchema);
//# sourceMappingURL=models.js.map