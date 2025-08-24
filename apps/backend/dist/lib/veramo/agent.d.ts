import { IResolver, IKeyManager, IDIDManager, ICredentialIssuer, TAgent } from '@veramo/core';
export declare function initializeAgent(): Promise<Agent>;
export type Agent = TAgent<IResolver & IKeyManager & IDIDManager & ICredentialIssuer>;
