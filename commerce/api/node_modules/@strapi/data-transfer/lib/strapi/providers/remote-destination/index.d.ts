/// <reference types="node" />
import { WebSocket } from 'ws';
import { Writable } from 'stream';
import { createDispatcher } from './utils';
import type { IDestinationProvider, IMetadata, ProviderType } from '../../../../types';
import type { ILocalStrapiDestinationProviderOptions } from '../local-destination';
interface ITokenAuth {
    type: 'token';
    token: string;
}
interface ICredentialsAuth {
    type: 'credentials';
    email: string;
    password: string;
}
export interface IRemoteStrapiDestinationProviderOptions extends Pick<ILocalStrapiDestinationProviderOptions, 'restore' | 'strategy'> {
    url: URL;
    auth?: ITokenAuth | ICredentialsAuth;
}
declare class RemoteStrapiDestinationProvider implements IDestinationProvider {
    #private;
    name: string;
    type: ProviderType;
    options: IRemoteStrapiDestinationProviderOptions;
    ws: WebSocket | null;
    dispatcher: ReturnType<typeof createDispatcher> | null;
    constructor(options: IRemoteStrapiDestinationProviderOptions);
    initTransfer(): Promise<string>;
    bootstrap(): Promise<void>;
    close(): Promise<void>;
    getMetadata(): Promise<IMetadata | null> | null;
    beforeTransfer(): Promise<void>;
    getSchemas(): Promise<Strapi.Schemas | null>;
    createEntitiesWriteStream(): Writable;
    createLinksWriteStream(): Writable;
    createConfigurationWriteStream(): Writable;
    createAssetsWriteStream(): Writable | Promise<Writable>;
}
export declare const createRemoteStrapiDestinationProvider: (options: IRemoteStrapiDestinationProviderOptions) => RemoteStrapiDestinationProvider;
export {};
