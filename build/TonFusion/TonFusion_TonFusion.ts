import {
    Cell,
    Slice,
    Address,
    Builder,
    beginCell,
    ComputeError,
    TupleItem,
    TupleReader,
    Dictionary,
    contractAddress,
    address,
    ContractProvider,
    Sender,
    Contract,
    ContractABI,
    ABIType,
    ABIGetter,
    ABIReceiver,
    TupleBuilder,
    DictionaryValue
} from '@ton/core';

export type DataSize = {
    $$type: 'DataSize';
    cells: bigint;
    bits: bigint;
    refs: bigint;
}

export function storeDataSize(src: DataSize) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.cells, 257);
        b_0.storeInt(src.bits, 257);
        b_0.storeInt(src.refs, 257);
    };
}

export function loadDataSize(slice: Slice) {
    const sc_0 = slice;
    const _cells = sc_0.loadIntBig(257);
    const _bits = sc_0.loadIntBig(257);
    const _refs = sc_0.loadIntBig(257);
    return { $$type: 'DataSize' as const, cells: _cells, bits: _bits, refs: _refs };
}

export function loadTupleDataSize(source: TupleReader) {
    const _cells = source.readBigNumber();
    const _bits = source.readBigNumber();
    const _refs = source.readBigNumber();
    return { $$type: 'DataSize' as const, cells: _cells, bits: _bits, refs: _refs };
}

export function loadGetterTupleDataSize(source: TupleReader) {
    const _cells = source.readBigNumber();
    const _bits = source.readBigNumber();
    const _refs = source.readBigNumber();
    return { $$type: 'DataSize' as const, cells: _cells, bits: _bits, refs: _refs };
}

export function storeTupleDataSize(source: DataSize) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.cells);
    builder.writeNumber(source.bits);
    builder.writeNumber(source.refs);
    return builder.build();
}

export function dictValueParserDataSize(): DictionaryValue<DataSize> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDataSize(src)).endCell());
        },
        parse: (src) => {
            return loadDataSize(src.loadRef().beginParse());
        }
    }
}

export type SignedBundle = {
    $$type: 'SignedBundle';
    signature: Buffer;
    signedData: Slice;
}

export function storeSignedBundle(src: SignedBundle) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeBuffer(src.signature);
        b_0.storeBuilder(src.signedData.asBuilder());
    };
}

export function loadSignedBundle(slice: Slice) {
    const sc_0 = slice;
    const _signature = sc_0.loadBuffer(64);
    const _signedData = sc_0;
    return { $$type: 'SignedBundle' as const, signature: _signature, signedData: _signedData };
}

export function loadTupleSignedBundle(source: TupleReader) {
    const _signature = source.readBuffer();
    const _signedData = source.readCell().asSlice();
    return { $$type: 'SignedBundle' as const, signature: _signature, signedData: _signedData };
}

export function loadGetterTupleSignedBundle(source: TupleReader) {
    const _signature = source.readBuffer();
    const _signedData = source.readCell().asSlice();
    return { $$type: 'SignedBundle' as const, signature: _signature, signedData: _signedData };
}

export function storeTupleSignedBundle(source: SignedBundle) {
    const builder = new TupleBuilder();
    builder.writeBuffer(source.signature);
    builder.writeSlice(source.signedData.asCell());
    return builder.build();
}

export function dictValueParserSignedBundle(): DictionaryValue<SignedBundle> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeSignedBundle(src)).endCell());
        },
        parse: (src) => {
            return loadSignedBundle(src.loadRef().beginParse());
        }
    }
}

export type StateInit = {
    $$type: 'StateInit';
    code: Cell;
    data: Cell;
}

export function storeStateInit(src: StateInit) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeRef(src.code);
        b_0.storeRef(src.data);
    };
}

export function loadStateInit(slice: Slice) {
    const sc_0 = slice;
    const _code = sc_0.loadRef();
    const _data = sc_0.loadRef();
    return { $$type: 'StateInit' as const, code: _code, data: _data };
}

export function loadTupleStateInit(source: TupleReader) {
    const _code = source.readCell();
    const _data = source.readCell();
    return { $$type: 'StateInit' as const, code: _code, data: _data };
}

export function loadGetterTupleStateInit(source: TupleReader) {
    const _code = source.readCell();
    const _data = source.readCell();
    return { $$type: 'StateInit' as const, code: _code, data: _data };
}

export function storeTupleStateInit(source: StateInit) {
    const builder = new TupleBuilder();
    builder.writeCell(source.code);
    builder.writeCell(source.data);
    return builder.build();
}

export function dictValueParserStateInit(): DictionaryValue<StateInit> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeStateInit(src)).endCell());
        },
        parse: (src) => {
            return loadStateInit(src.loadRef().beginParse());
        }
    }
}

export type Context = {
    $$type: 'Context';
    bounceable: boolean;
    sender: Address;
    value: bigint;
    raw: Slice;
}

export function storeContext(src: Context) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeBit(src.bounceable);
        b_0.storeAddress(src.sender);
        b_0.storeInt(src.value, 257);
        b_0.storeRef(src.raw.asCell());
    };
}

export function loadContext(slice: Slice) {
    const sc_0 = slice;
    const _bounceable = sc_0.loadBit();
    const _sender = sc_0.loadAddress();
    const _value = sc_0.loadIntBig(257);
    const _raw = sc_0.loadRef().asSlice();
    return { $$type: 'Context' as const, bounceable: _bounceable, sender: _sender, value: _value, raw: _raw };
}

export function loadTupleContext(source: TupleReader) {
    const _bounceable = source.readBoolean();
    const _sender = source.readAddress();
    const _value = source.readBigNumber();
    const _raw = source.readCell().asSlice();
    return { $$type: 'Context' as const, bounceable: _bounceable, sender: _sender, value: _value, raw: _raw };
}

export function loadGetterTupleContext(source: TupleReader) {
    const _bounceable = source.readBoolean();
    const _sender = source.readAddress();
    const _value = source.readBigNumber();
    const _raw = source.readCell().asSlice();
    return { $$type: 'Context' as const, bounceable: _bounceable, sender: _sender, value: _value, raw: _raw };
}

export function storeTupleContext(source: Context) {
    const builder = new TupleBuilder();
    builder.writeBoolean(source.bounceable);
    builder.writeAddress(source.sender);
    builder.writeNumber(source.value);
    builder.writeSlice(source.raw.asCell());
    return builder.build();
}

export function dictValueParserContext(): DictionaryValue<Context> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeContext(src)).endCell());
        },
        parse: (src) => {
            return loadContext(src.loadRef().beginParse());
        }
    }
}

export type SendParameters = {
    $$type: 'SendParameters';
    mode: bigint;
    body: Cell | null;
    code: Cell | null;
    data: Cell | null;
    value: bigint;
    to: Address;
    bounce: boolean;
}

export function storeSendParameters(src: SendParameters) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.mode, 257);
        if (src.body !== null && src.body !== undefined) { b_0.storeBit(true).storeRef(src.body); } else { b_0.storeBit(false); }
        if (src.code !== null && src.code !== undefined) { b_0.storeBit(true).storeRef(src.code); } else { b_0.storeBit(false); }
        if (src.data !== null && src.data !== undefined) { b_0.storeBit(true).storeRef(src.data); } else { b_0.storeBit(false); }
        b_0.storeInt(src.value, 257);
        b_0.storeAddress(src.to);
        b_0.storeBit(src.bounce);
    };
}

export function loadSendParameters(slice: Slice) {
    const sc_0 = slice;
    const _mode = sc_0.loadIntBig(257);
    const _body = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _code = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _data = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _value = sc_0.loadIntBig(257);
    const _to = sc_0.loadAddress();
    const _bounce = sc_0.loadBit();
    return { $$type: 'SendParameters' as const, mode: _mode, body: _body, code: _code, data: _data, value: _value, to: _to, bounce: _bounce };
}

export function loadTupleSendParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _code = source.readCellOpt();
    const _data = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'SendParameters' as const, mode: _mode, body: _body, code: _code, data: _data, value: _value, to: _to, bounce: _bounce };
}

export function loadGetterTupleSendParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _code = source.readCellOpt();
    const _data = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'SendParameters' as const, mode: _mode, body: _body, code: _code, data: _data, value: _value, to: _to, bounce: _bounce };
}

export function storeTupleSendParameters(source: SendParameters) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.mode);
    builder.writeCell(source.body);
    builder.writeCell(source.code);
    builder.writeCell(source.data);
    builder.writeNumber(source.value);
    builder.writeAddress(source.to);
    builder.writeBoolean(source.bounce);
    return builder.build();
}

export function dictValueParserSendParameters(): DictionaryValue<SendParameters> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeSendParameters(src)).endCell());
        },
        parse: (src) => {
            return loadSendParameters(src.loadRef().beginParse());
        }
    }
}

export type MessageParameters = {
    $$type: 'MessageParameters';
    mode: bigint;
    body: Cell | null;
    value: bigint;
    to: Address;
    bounce: boolean;
}

export function storeMessageParameters(src: MessageParameters) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.mode, 257);
        if (src.body !== null && src.body !== undefined) { b_0.storeBit(true).storeRef(src.body); } else { b_0.storeBit(false); }
        b_0.storeInt(src.value, 257);
        b_0.storeAddress(src.to);
        b_0.storeBit(src.bounce);
    };
}

export function loadMessageParameters(slice: Slice) {
    const sc_0 = slice;
    const _mode = sc_0.loadIntBig(257);
    const _body = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _value = sc_0.loadIntBig(257);
    const _to = sc_0.loadAddress();
    const _bounce = sc_0.loadBit();
    return { $$type: 'MessageParameters' as const, mode: _mode, body: _body, value: _value, to: _to, bounce: _bounce };
}

export function loadTupleMessageParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'MessageParameters' as const, mode: _mode, body: _body, value: _value, to: _to, bounce: _bounce };
}

export function loadGetterTupleMessageParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'MessageParameters' as const, mode: _mode, body: _body, value: _value, to: _to, bounce: _bounce };
}

export function storeTupleMessageParameters(source: MessageParameters) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.mode);
    builder.writeCell(source.body);
    builder.writeNumber(source.value);
    builder.writeAddress(source.to);
    builder.writeBoolean(source.bounce);
    return builder.build();
}

export function dictValueParserMessageParameters(): DictionaryValue<MessageParameters> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeMessageParameters(src)).endCell());
        },
        parse: (src) => {
            return loadMessageParameters(src.loadRef().beginParse());
        }
    }
}

export type DeployParameters = {
    $$type: 'DeployParameters';
    mode: bigint;
    body: Cell | null;
    value: bigint;
    bounce: boolean;
    init: StateInit;
}

export function storeDeployParameters(src: DeployParameters) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.mode, 257);
        if (src.body !== null && src.body !== undefined) { b_0.storeBit(true).storeRef(src.body); } else { b_0.storeBit(false); }
        b_0.storeInt(src.value, 257);
        b_0.storeBit(src.bounce);
        b_0.store(storeStateInit(src.init));
    };
}

export function loadDeployParameters(slice: Slice) {
    const sc_0 = slice;
    const _mode = sc_0.loadIntBig(257);
    const _body = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _value = sc_0.loadIntBig(257);
    const _bounce = sc_0.loadBit();
    const _init = loadStateInit(sc_0);
    return { $$type: 'DeployParameters' as const, mode: _mode, body: _body, value: _value, bounce: _bounce, init: _init };
}

export function loadTupleDeployParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _bounce = source.readBoolean();
    const _init = loadTupleStateInit(source);
    return { $$type: 'DeployParameters' as const, mode: _mode, body: _body, value: _value, bounce: _bounce, init: _init };
}

export function loadGetterTupleDeployParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _bounce = source.readBoolean();
    const _init = loadGetterTupleStateInit(source);
    return { $$type: 'DeployParameters' as const, mode: _mode, body: _body, value: _value, bounce: _bounce, init: _init };
}

export function storeTupleDeployParameters(source: DeployParameters) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.mode);
    builder.writeCell(source.body);
    builder.writeNumber(source.value);
    builder.writeBoolean(source.bounce);
    builder.writeTuple(storeTupleStateInit(source.init));
    return builder.build();
}

export function dictValueParserDeployParameters(): DictionaryValue<DeployParameters> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDeployParameters(src)).endCell());
        },
        parse: (src) => {
            return loadDeployParameters(src.loadRef().beginParse());
        }
    }
}

export type StdAddress = {
    $$type: 'StdAddress';
    workchain: bigint;
    address: bigint;
}

export function storeStdAddress(src: StdAddress) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.workchain, 8);
        b_0.storeUint(src.address, 256);
    };
}

export function loadStdAddress(slice: Slice) {
    const sc_0 = slice;
    const _workchain = sc_0.loadIntBig(8);
    const _address = sc_0.loadUintBig(256);
    return { $$type: 'StdAddress' as const, workchain: _workchain, address: _address };
}

export function loadTupleStdAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readBigNumber();
    return { $$type: 'StdAddress' as const, workchain: _workchain, address: _address };
}

export function loadGetterTupleStdAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readBigNumber();
    return { $$type: 'StdAddress' as const, workchain: _workchain, address: _address };
}

export function storeTupleStdAddress(source: StdAddress) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.workchain);
    builder.writeNumber(source.address);
    return builder.build();
}

export function dictValueParserStdAddress(): DictionaryValue<StdAddress> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeStdAddress(src)).endCell());
        },
        parse: (src) => {
            return loadStdAddress(src.loadRef().beginParse());
        }
    }
}

export type VarAddress = {
    $$type: 'VarAddress';
    workchain: bigint;
    address: Slice;
}

export function storeVarAddress(src: VarAddress) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.workchain, 32);
        b_0.storeRef(src.address.asCell());
    };
}

export function loadVarAddress(slice: Slice) {
    const sc_0 = slice;
    const _workchain = sc_0.loadIntBig(32);
    const _address = sc_0.loadRef().asSlice();
    return { $$type: 'VarAddress' as const, workchain: _workchain, address: _address };
}

export function loadTupleVarAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readCell().asSlice();
    return { $$type: 'VarAddress' as const, workchain: _workchain, address: _address };
}

export function loadGetterTupleVarAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readCell().asSlice();
    return { $$type: 'VarAddress' as const, workchain: _workchain, address: _address };
}

export function storeTupleVarAddress(source: VarAddress) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.workchain);
    builder.writeSlice(source.address.asCell());
    return builder.build();
}

export function dictValueParserVarAddress(): DictionaryValue<VarAddress> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeVarAddress(src)).endCell());
        },
        parse: (src) => {
            return loadVarAddress(src.loadRef().beginParse());
        }
    }
}

export type BasechainAddress = {
    $$type: 'BasechainAddress';
    hash: bigint | null;
}

export function storeBasechainAddress(src: BasechainAddress) {
    return (builder: Builder) => {
        const b_0 = builder;
        if (src.hash !== null && src.hash !== undefined) { b_0.storeBit(true).storeInt(src.hash, 257); } else { b_0.storeBit(false); }
    };
}

export function loadBasechainAddress(slice: Slice) {
    const sc_0 = slice;
    const _hash = sc_0.loadBit() ? sc_0.loadIntBig(257) : null;
    return { $$type: 'BasechainAddress' as const, hash: _hash };
}

export function loadTupleBasechainAddress(source: TupleReader) {
    const _hash = source.readBigNumberOpt();
    return { $$type: 'BasechainAddress' as const, hash: _hash };
}

export function loadGetterTupleBasechainAddress(source: TupleReader) {
    const _hash = source.readBigNumberOpt();
    return { $$type: 'BasechainAddress' as const, hash: _hash };
}

export function storeTupleBasechainAddress(source: BasechainAddress) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.hash);
    return builder.build();
}

export function dictValueParserBasechainAddress(): DictionaryValue<BasechainAddress> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeBasechainAddress(src)).endCell());
        },
        parse: (src) => {
            return loadBasechainAddress(src.loadRef().beginParse());
        }
    }
}

export type Deploy = {
    $$type: 'Deploy';
    queryId: bigint;
}

export function storeDeploy(src: Deploy) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(2490013878, 32);
        b_0.storeUint(src.queryId, 64);
    };
}

export function loadDeploy(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 2490013878) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    return { $$type: 'Deploy' as const, queryId: _queryId };
}

export function loadTupleDeploy(source: TupleReader) {
    const _queryId = source.readBigNumber();
    return { $$type: 'Deploy' as const, queryId: _queryId };
}

export function loadGetterTupleDeploy(source: TupleReader) {
    const _queryId = source.readBigNumber();
    return { $$type: 'Deploy' as const, queryId: _queryId };
}

export function storeTupleDeploy(source: Deploy) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    return builder.build();
}

export function dictValueParserDeploy(): DictionaryValue<Deploy> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDeploy(src)).endCell());
        },
        parse: (src) => {
            return loadDeploy(src.loadRef().beginParse());
        }
    }
}

export type DeployOk = {
    $$type: 'DeployOk';
    queryId: bigint;
}

export function storeDeployOk(src: DeployOk) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(2952335191, 32);
        b_0.storeUint(src.queryId, 64);
    };
}

export function loadDeployOk(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 2952335191) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    return { $$type: 'DeployOk' as const, queryId: _queryId };
}

export function loadTupleDeployOk(source: TupleReader) {
    const _queryId = source.readBigNumber();
    return { $$type: 'DeployOk' as const, queryId: _queryId };
}

export function loadGetterTupleDeployOk(source: TupleReader) {
    const _queryId = source.readBigNumber();
    return { $$type: 'DeployOk' as const, queryId: _queryId };
}

export function storeTupleDeployOk(source: DeployOk) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    return builder.build();
}

export function dictValueParserDeployOk(): DictionaryValue<DeployOk> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDeployOk(src)).endCell());
        },
        parse: (src) => {
            return loadDeployOk(src.loadRef().beginParse());
        }
    }
}

export type FactoryDeploy = {
    $$type: 'FactoryDeploy';
    queryId: bigint;
    cashback: Address;
}

export function storeFactoryDeploy(src: FactoryDeploy) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1829761339, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeAddress(src.cashback);
    };
}

export function loadFactoryDeploy(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1829761339) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _cashback = sc_0.loadAddress();
    return { $$type: 'FactoryDeploy' as const, queryId: _queryId, cashback: _cashback };
}

export function loadTupleFactoryDeploy(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _cashback = source.readAddress();
    return { $$type: 'FactoryDeploy' as const, queryId: _queryId, cashback: _cashback };
}

export function loadGetterTupleFactoryDeploy(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _cashback = source.readAddress();
    return { $$type: 'FactoryDeploy' as const, queryId: _queryId, cashback: _cashback };
}

export function storeTupleFactoryDeploy(source: FactoryDeploy) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeAddress(source.cashback);
    return builder.build();
}

export function dictValueParserFactoryDeploy(): DictionaryValue<FactoryDeploy> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeFactoryDeploy(src)).endCell());
        },
        parse: (src) => {
            return loadFactoryDeploy(src.loadRef().beginParse());
        }
    }
}

export type LockJetton = {
    $$type: 'LockJetton';
    orderConfig: OrderConfig;
    jetton: Cell;
    customPayload: Cell | null;
}

export function storeLockJetton(src: LockJetton) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(4111661023, 32);
        b_0.store(storeOrderConfig(src.orderConfig));
        b_0.storeRef(src.jetton);
        if (src.customPayload !== null && src.customPayload !== undefined) { b_0.storeBit(true).storeRef(src.customPayload); } else { b_0.storeBit(false); }
    };
}

export function loadLockJetton(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 4111661023) { throw Error('Invalid prefix'); }
    const _orderConfig = loadOrderConfig(sc_0);
    const _jetton = sc_0.loadRef();
    const _customPayload = sc_0.loadBit() ? sc_0.loadRef() : null;
    return { $$type: 'LockJetton' as const, orderConfig: _orderConfig, jetton: _jetton, customPayload: _customPayload };
}

export function loadTupleLockJetton(source: TupleReader) {
    const _orderConfig = loadTupleOrderConfig(source);
    const _jetton = source.readCell();
    const _customPayload = source.readCellOpt();
    return { $$type: 'LockJetton' as const, orderConfig: _orderConfig, jetton: _jetton, customPayload: _customPayload };
}

export function loadGetterTupleLockJetton(source: TupleReader) {
    const _orderConfig = loadGetterTupleOrderConfig(source);
    const _jetton = source.readCell();
    const _customPayload = source.readCellOpt();
    return { $$type: 'LockJetton' as const, orderConfig: _orderConfig, jetton: _jetton, customPayload: _customPayload };
}

export function storeTupleLockJetton(source: LockJetton) {
    const builder = new TupleBuilder();
    builder.writeTuple(storeTupleOrderConfig(source.orderConfig));
    builder.writeCell(source.jetton);
    builder.writeCell(source.customPayload);
    return builder.build();
}

export function dictValueParserLockJetton(): DictionaryValue<LockJetton> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeLockJetton(src)).endCell());
        },
        parse: (src) => {
            return loadLockJetton(src.loadRef().beginParse());
        }
    }
}

export type CreateOrder = {
    $$type: 'CreateOrder';
    orderConfig: Order;
    jetton: Cell;
    customPayload: Cell | null;
}

export function storeCreateOrder(src: CreateOrder) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1935855772, 32);
        const b_1 = new Builder();
        b_1.store(storeOrder(src.orderConfig));
        b_1.storeRef(src.jetton);
        if (src.customPayload !== null && src.customPayload !== undefined) { b_1.storeBit(true).storeRef(src.customPayload); } else { b_1.storeBit(false); }
        b_0.storeRef(b_1.endCell());
    };
}

export function loadCreateOrder(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1935855772) { throw Error('Invalid prefix'); }
    const sc_1 = sc_0.loadRef().beginParse();
    const _orderConfig = loadOrder(sc_1);
    const _jetton = sc_1.loadRef();
    const _customPayload = sc_1.loadBit() ? sc_1.loadRef() : null;
    return { $$type: 'CreateOrder' as const, orderConfig: _orderConfig, jetton: _jetton, customPayload: _customPayload };
}

export function loadTupleCreateOrder(source: TupleReader) {
    const _orderConfig = loadTupleOrder(source);
    const _jetton = source.readCell();
    const _customPayload = source.readCellOpt();
    return { $$type: 'CreateOrder' as const, orderConfig: _orderConfig, jetton: _jetton, customPayload: _customPayload };
}

export function loadGetterTupleCreateOrder(source: TupleReader) {
    const _orderConfig = loadGetterTupleOrder(source);
    const _jetton = source.readCell();
    const _customPayload = source.readCellOpt();
    return { $$type: 'CreateOrder' as const, orderConfig: _orderConfig, jetton: _jetton, customPayload: _customPayload };
}

export function storeTupleCreateOrder(source: CreateOrder) {
    const builder = new TupleBuilder();
    builder.writeTuple(storeTupleOrder(source.orderConfig));
    builder.writeCell(source.jetton);
    builder.writeCell(source.customPayload);
    return builder.build();
}

export function dictValueParserCreateOrder(): DictionaryValue<CreateOrder> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeCreateOrder(src)).endCell());
        },
        parse: (src) => {
            return loadCreateOrder(src.loadRef().beginParse());
        }
    }
}

export type CreateEVMToTONOrder = {
    $$type: 'CreateEVMToTONOrder';
    orderConfig: OrderConfig;
    evmContractAddress: Address;
    customPayload: Cell | null;
}

export function storeCreateEVMToTONOrder(src: CreateEVMToTONOrder) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(2335447074, 32);
        b_0.store(storeOrderConfig(src.orderConfig));
        const b_1 = new Builder();
        b_1.storeAddress(src.evmContractAddress);
        if (src.customPayload !== null && src.customPayload !== undefined) { b_1.storeBit(true).storeRef(src.customPayload); } else { b_1.storeBit(false); }
        b_0.storeRef(b_1.endCell());
    };
}

export function loadCreateEVMToTONOrder(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 2335447074) { throw Error('Invalid prefix'); }
    const _orderConfig = loadOrderConfig(sc_0);
    const sc_1 = sc_0.loadRef().beginParse();
    const _evmContractAddress = sc_1.loadAddress();
    const _customPayload = sc_1.loadBit() ? sc_1.loadRef() : null;
    return { $$type: 'CreateEVMToTONOrder' as const, orderConfig: _orderConfig, evmContractAddress: _evmContractAddress, customPayload: _customPayload };
}

export function loadTupleCreateEVMToTONOrder(source: TupleReader) {
    const _orderConfig = loadTupleOrderConfig(source);
    const _evmContractAddress = source.readAddress();
    const _customPayload = source.readCellOpt();
    return { $$type: 'CreateEVMToTONOrder' as const, orderConfig: _orderConfig, evmContractAddress: _evmContractAddress, customPayload: _customPayload };
}

export function loadGetterTupleCreateEVMToTONOrder(source: TupleReader) {
    const _orderConfig = loadGetterTupleOrderConfig(source);
    const _evmContractAddress = source.readAddress();
    const _customPayload = source.readCellOpt();
    return { $$type: 'CreateEVMToTONOrder' as const, orderConfig: _orderConfig, evmContractAddress: _evmContractAddress, customPayload: _customPayload };
}

export function storeTupleCreateEVMToTONOrder(source: CreateEVMToTONOrder) {
    const builder = new TupleBuilder();
    builder.writeTuple(storeTupleOrderConfig(source.orderConfig));
    builder.writeAddress(source.evmContractAddress);
    builder.writeCell(source.customPayload);
    return builder.build();
}

export function dictValueParserCreateEVMToTONOrder(): DictionaryValue<CreateEVMToTONOrder> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeCreateEVMToTONOrder(src)).endCell());
        },
        parse: (src) => {
            return loadCreateEVMToTONOrder(src.loadRef().beginParse());
        }
    }
}

export type CreateTONToEVMOrder = {
    $$type: 'CreateTONToEVMOrder';
    orderConfig: OrderConfig;
    targetChainId: bigint;
    customPayload: Cell | null;
}

export function storeCreateTONToEVMOrder(src: CreateTONToEVMOrder) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1646500216, 32);
        b_0.store(storeOrderConfig(src.orderConfig));
        b_0.storeUint(src.targetChainId, 32);
        if (src.customPayload !== null && src.customPayload !== undefined) { b_0.storeBit(true).storeRef(src.customPayload); } else { b_0.storeBit(false); }
    };
}

export function loadCreateTONToEVMOrder(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1646500216) { throw Error('Invalid prefix'); }
    const _orderConfig = loadOrderConfig(sc_0);
    const _targetChainId = sc_0.loadUintBig(32);
    const _customPayload = sc_0.loadBit() ? sc_0.loadRef() : null;
    return { $$type: 'CreateTONToEVMOrder' as const, orderConfig: _orderConfig, targetChainId: _targetChainId, customPayload: _customPayload };
}

export function loadTupleCreateTONToEVMOrder(source: TupleReader) {
    const _orderConfig = loadTupleOrderConfig(source);
    const _targetChainId = source.readBigNumber();
    const _customPayload = source.readCellOpt();
    return { $$type: 'CreateTONToEVMOrder' as const, orderConfig: _orderConfig, targetChainId: _targetChainId, customPayload: _customPayload };
}

export function loadGetterTupleCreateTONToEVMOrder(source: TupleReader) {
    const _orderConfig = loadGetterTupleOrderConfig(source);
    const _targetChainId = source.readBigNumber();
    const _customPayload = source.readCellOpt();
    return { $$type: 'CreateTONToEVMOrder' as const, orderConfig: _orderConfig, targetChainId: _targetChainId, customPayload: _customPayload };
}

export function storeTupleCreateTONToEVMOrder(source: CreateTONToEVMOrder) {
    const builder = new TupleBuilder();
    builder.writeTuple(storeTupleOrderConfig(source.orderConfig));
    builder.writeNumber(source.targetChainId);
    builder.writeCell(source.customPayload);
    return builder.build();
}

export function dictValueParserCreateTONToEVMOrder(): DictionaryValue<CreateTONToEVMOrder> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeCreateTONToEVMOrder(src)).endCell());
        },
        parse: (src) => {
            return loadCreateTONToEVMOrder(src.loadRef().beginParse());
        }
    }
}

export type PartialFill = {
    $$type: 'PartialFill';
    orderHash: bigint;
    secret: bigint;
    fillAmount: bigint;
    resolver: Address;
    customPayload: Cell | null;
}

export function storePartialFill(src: PartialFill) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1324731174, 32);
        b_0.storeUint(src.orderHash, 256);
        b_0.storeUint(src.secret, 256);
        b_0.storeUint(src.fillAmount, 64);
        b_0.storeAddress(src.resolver);
        if (src.customPayload !== null && src.customPayload !== undefined) { b_0.storeBit(true).storeRef(src.customPayload); } else { b_0.storeBit(false); }
    };
}

export function loadPartialFill(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1324731174) { throw Error('Invalid prefix'); }
    const _orderHash = sc_0.loadUintBig(256);
    const _secret = sc_0.loadUintBig(256);
    const _fillAmount = sc_0.loadUintBig(64);
    const _resolver = sc_0.loadAddress();
    const _customPayload = sc_0.loadBit() ? sc_0.loadRef() : null;
    return { $$type: 'PartialFill' as const, orderHash: _orderHash, secret: _secret, fillAmount: _fillAmount, resolver: _resolver, customPayload: _customPayload };
}

export function loadTuplePartialFill(source: TupleReader) {
    const _orderHash = source.readBigNumber();
    const _secret = source.readBigNumber();
    const _fillAmount = source.readBigNumber();
    const _resolver = source.readAddress();
    const _customPayload = source.readCellOpt();
    return { $$type: 'PartialFill' as const, orderHash: _orderHash, secret: _secret, fillAmount: _fillAmount, resolver: _resolver, customPayload: _customPayload };
}

export function loadGetterTuplePartialFill(source: TupleReader) {
    const _orderHash = source.readBigNumber();
    const _secret = source.readBigNumber();
    const _fillAmount = source.readBigNumber();
    const _resolver = source.readAddress();
    const _customPayload = source.readCellOpt();
    return { $$type: 'PartialFill' as const, orderHash: _orderHash, secret: _secret, fillAmount: _fillAmount, resolver: _resolver, customPayload: _customPayload };
}

export function storeTuplePartialFill(source: PartialFill) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.orderHash);
    builder.writeNumber(source.secret);
    builder.writeNumber(source.fillAmount);
    builder.writeAddress(source.resolver);
    builder.writeCell(source.customPayload);
    return builder.build();
}

export function dictValueParserPartialFill(): DictionaryValue<PartialFill> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storePartialFill(src)).endCell());
        },
        parse: (src) => {
            return loadPartialFill(src.loadRef().beginParse());
        }
    }
}

export type CompletePartialFill = {
    $$type: 'CompletePartialFill';
    orderHash: bigint;
    secret: bigint;
    customPayload: Cell | null;
}

export function storeCompletePartialFill(src: CompletePartialFill) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(2335447075, 32);
        b_0.storeUint(src.orderHash, 256);
        b_0.storeUint(src.secret, 256);
        if (src.customPayload !== null && src.customPayload !== undefined) { b_0.storeBit(true).storeRef(src.customPayload); } else { b_0.storeBit(false); }
    };
}

export function loadCompletePartialFill(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 2335447075) { throw Error('Invalid prefix'); }
    const _orderHash = sc_0.loadUintBig(256);
    const _secret = sc_0.loadUintBig(256);
    const _customPayload = sc_0.loadBit() ? sc_0.loadRef() : null;
    return { $$type: 'CompletePartialFill' as const, orderHash: _orderHash, secret: _secret, customPayload: _customPayload };
}

export function loadTupleCompletePartialFill(source: TupleReader) {
    const _orderHash = source.readBigNumber();
    const _secret = source.readBigNumber();
    const _customPayload = source.readCellOpt();
    return { $$type: 'CompletePartialFill' as const, orderHash: _orderHash, secret: _secret, customPayload: _customPayload };
}

export function loadGetterTupleCompletePartialFill(source: TupleReader) {
    const _orderHash = source.readBigNumber();
    const _secret = source.readBigNumber();
    const _customPayload = source.readCellOpt();
    return { $$type: 'CompletePartialFill' as const, orderHash: _orderHash, secret: _secret, customPayload: _customPayload };
}

export function storeTupleCompletePartialFill(source: CompletePartialFill) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.orderHash);
    builder.writeNumber(source.secret);
    builder.writeCell(source.customPayload);
    return builder.build();
}

export function dictValueParserCompletePartialFill(): DictionaryValue<CompletePartialFill> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeCompletePartialFill(src)).endCell());
        },
        parse: (src) => {
            return loadCompletePartialFill(src.loadRef().beginParse());
        }
    }
}

export type DeployEscrow = {
    $$type: 'DeployEscrow';
    chainId: bigint;
    targetAddress: Address;
    customPayload: Cell | null;
}

export function storeDeployEscrow(src: DeployEscrow) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1499400124, 32);
        b_0.storeUint(src.chainId, 32);
        b_0.storeAddress(src.targetAddress);
        if (src.customPayload !== null && src.customPayload !== undefined) { b_0.storeBit(true).storeRef(src.customPayload); } else { b_0.storeBit(false); }
    };
}

export function loadDeployEscrow(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1499400124) { throw Error('Invalid prefix'); }
    const _chainId = sc_0.loadUintBig(32);
    const _targetAddress = sc_0.loadAddress();
    const _customPayload = sc_0.loadBit() ? sc_0.loadRef() : null;
    return { $$type: 'DeployEscrow' as const, chainId: _chainId, targetAddress: _targetAddress, customPayload: _customPayload };
}

export function loadTupleDeployEscrow(source: TupleReader) {
    const _chainId = source.readBigNumber();
    const _targetAddress = source.readAddress();
    const _customPayload = source.readCellOpt();
    return { $$type: 'DeployEscrow' as const, chainId: _chainId, targetAddress: _targetAddress, customPayload: _customPayload };
}

export function loadGetterTupleDeployEscrow(source: TupleReader) {
    const _chainId = source.readBigNumber();
    const _targetAddress = source.readAddress();
    const _customPayload = source.readCellOpt();
    return { $$type: 'DeployEscrow' as const, chainId: _chainId, targetAddress: _targetAddress, customPayload: _customPayload };
}

export function storeTupleDeployEscrow(source: DeployEscrow) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.chainId);
    builder.writeAddress(source.targetAddress);
    builder.writeCell(source.customPayload);
    return builder.build();
}

export function dictValueParserDeployEscrow(): DictionaryValue<DeployEscrow> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDeployEscrow(src)).endCell());
        },
        parse: (src) => {
            return loadDeployEscrow(src.loadRef().beginParse());
        }
    }
}

export type EscrowDeployed = {
    $$type: 'EscrowDeployed';
    chainId: bigint;
    contractAddress: Address;
    success: boolean;
    customPayload: Cell | null;
}

export function storeEscrowDeployed(src: EscrowDeployed) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(2078119902, 32);
        b_0.storeUint(src.chainId, 32);
        b_0.storeAddress(src.contractAddress);
        b_0.storeBit(src.success);
        if (src.customPayload !== null && src.customPayload !== undefined) { b_0.storeBit(true).storeRef(src.customPayload); } else { b_0.storeBit(false); }
    };
}

export function loadEscrowDeployed(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 2078119902) { throw Error('Invalid prefix'); }
    const _chainId = sc_0.loadUintBig(32);
    const _contractAddress = sc_0.loadAddress();
    const _success = sc_0.loadBit();
    const _customPayload = sc_0.loadBit() ? sc_0.loadRef() : null;
    return { $$type: 'EscrowDeployed' as const, chainId: _chainId, contractAddress: _contractAddress, success: _success, customPayload: _customPayload };
}

export function loadTupleEscrowDeployed(source: TupleReader) {
    const _chainId = source.readBigNumber();
    const _contractAddress = source.readAddress();
    const _success = source.readBoolean();
    const _customPayload = source.readCellOpt();
    return { $$type: 'EscrowDeployed' as const, chainId: _chainId, contractAddress: _contractAddress, success: _success, customPayload: _customPayload };
}

export function loadGetterTupleEscrowDeployed(source: TupleReader) {
    const _chainId = source.readBigNumber();
    const _contractAddress = source.readAddress();
    const _success = source.readBoolean();
    const _customPayload = source.readCellOpt();
    return { $$type: 'EscrowDeployed' as const, chainId: _chainId, contractAddress: _contractAddress, success: _success, customPayload: _customPayload };
}

export function storeTupleEscrowDeployed(source: EscrowDeployed) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.chainId);
    builder.writeAddress(source.contractAddress);
    builder.writeBoolean(source.success);
    builder.writeCell(source.customPayload);
    return builder.build();
}

export function dictValueParserEscrowDeployed(): DictionaryValue<EscrowDeployed> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeEscrowDeployed(src)).endCell());
        },
        parse: (src) => {
            return loadEscrowDeployed(src.loadRef().beginParse());
        }
    }
}

export type RegisterRelayer = {
    $$type: 'RegisterRelayer';
    relayer: Address;
    customPayload: Cell | null;
}

export function storeRegisterRelayer(src: RegisterRelayer) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1935855774, 32);
        b_0.storeAddress(src.relayer);
        if (src.customPayload !== null && src.customPayload !== undefined) { b_0.storeBit(true).storeRef(src.customPayload); } else { b_0.storeBit(false); }
    };
}

export function loadRegisterRelayer(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1935855774) { throw Error('Invalid prefix'); }
    const _relayer = sc_0.loadAddress();
    const _customPayload = sc_0.loadBit() ? sc_0.loadRef() : null;
    return { $$type: 'RegisterRelayer' as const, relayer: _relayer, customPayload: _customPayload };
}

export function loadTupleRegisterRelayer(source: TupleReader) {
    const _relayer = source.readAddress();
    const _customPayload = source.readCellOpt();
    return { $$type: 'RegisterRelayer' as const, relayer: _relayer, customPayload: _customPayload };
}

export function loadGetterTupleRegisterRelayer(source: TupleReader) {
    const _relayer = source.readAddress();
    const _customPayload = source.readCellOpt();
    return { $$type: 'RegisterRelayer' as const, relayer: _relayer, customPayload: _customPayload };
}

export function storeTupleRegisterRelayer(source: RegisterRelayer) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.relayer);
    builder.writeCell(source.customPayload);
    return builder.build();
}

export function dictValueParserRegisterRelayer(): DictionaryValue<RegisterRelayer> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeRegisterRelayer(src)).endCell());
        },
        parse: (src) => {
            return loadRegisterRelayer(src.loadRef().beginParse());
        }
    }
}

export type UpdateRelayerStats = {
    $$type: 'UpdateRelayerStats';
    relayer: Address;
    success: boolean;
    customPayload: Cell | null;
}

export function storeUpdateRelayerStats(src: UpdateRelayerStats) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1935855775, 32);
        b_0.storeAddress(src.relayer);
        b_0.storeBit(src.success);
        if (src.customPayload !== null && src.customPayload !== undefined) { b_0.storeBit(true).storeRef(src.customPayload); } else { b_0.storeBit(false); }
    };
}

export function loadUpdateRelayerStats(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1935855775) { throw Error('Invalid prefix'); }
    const _relayer = sc_0.loadAddress();
    const _success = sc_0.loadBit();
    const _customPayload = sc_0.loadBit() ? sc_0.loadRef() : null;
    return { $$type: 'UpdateRelayerStats' as const, relayer: _relayer, success: _success, customPayload: _customPayload };
}

export function loadTupleUpdateRelayerStats(source: TupleReader) {
    const _relayer = source.readAddress();
    const _success = source.readBoolean();
    const _customPayload = source.readCellOpt();
    return { $$type: 'UpdateRelayerStats' as const, relayer: _relayer, success: _success, customPayload: _customPayload };
}

export function loadGetterTupleUpdateRelayerStats(source: TupleReader) {
    const _relayer = source.readAddress();
    const _success = source.readBoolean();
    const _customPayload = source.readCellOpt();
    return { $$type: 'UpdateRelayerStats' as const, relayer: _relayer, success: _success, customPayload: _customPayload };
}

export function storeTupleUpdateRelayerStats(source: UpdateRelayerStats) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.relayer);
    builder.writeBoolean(source.success);
    builder.writeCell(source.customPayload);
    return builder.build();
}

export function dictValueParserUpdateRelayerStats(): DictionaryValue<UpdateRelayerStats> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeUpdateRelayerStats(src)).endCell());
        },
        parse: (src) => {
            return loadUpdateRelayerStats(src.loadRef().beginParse());
        }
    }
}

export type GetFund = {
    $$type: 'GetFund';
    secret: bigint;
    hash: bigint;
    customPayload: Cell | null;
}

export function storeGetFund(src: GetFund) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1348689874, 32);
        b_0.storeUint(src.secret, 256);
        b_0.storeUint(src.hash, 256);
        if (src.customPayload !== null && src.customPayload !== undefined) { b_0.storeBit(true).storeRef(src.customPayload); } else { b_0.storeBit(false); }
    };
}

export function loadGetFund(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1348689874) { throw Error('Invalid prefix'); }
    const _secret = sc_0.loadUintBig(256);
    const _hash = sc_0.loadUintBig(256);
    const _customPayload = sc_0.loadBit() ? sc_0.loadRef() : null;
    return { $$type: 'GetFund' as const, secret: _secret, hash: _hash, customPayload: _customPayload };
}

export function loadTupleGetFund(source: TupleReader) {
    const _secret = source.readBigNumber();
    const _hash = source.readBigNumber();
    const _customPayload = source.readCellOpt();
    return { $$type: 'GetFund' as const, secret: _secret, hash: _hash, customPayload: _customPayload };
}

export function loadGetterTupleGetFund(source: TupleReader) {
    const _secret = source.readBigNumber();
    const _hash = source.readBigNumber();
    const _customPayload = source.readCellOpt();
    return { $$type: 'GetFund' as const, secret: _secret, hash: _hash, customPayload: _customPayload };
}

export function storeTupleGetFund(source: GetFund) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.secret);
    builder.writeNumber(source.hash);
    builder.writeCell(source.customPayload);
    return builder.build();
}

export function dictValueParserGetFund(): DictionaryValue<GetFund> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeGetFund(src)).endCell());
        },
        parse: (src) => {
            return loadGetFund(src.loadRef().beginParse());
        }
    }
}

export type Refund = {
    $$type: 'Refund';
    hash: bigint;
    customPayload: Cell | null;
}

export function storeRefund(src: Refund) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(3835567563, 32);
        b_0.storeUint(src.hash, 256);
        if (src.customPayload !== null && src.customPayload !== undefined) { b_0.storeBit(true).storeRef(src.customPayload); } else { b_0.storeBit(false); }
    };
}

export function loadRefund(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 3835567563) { throw Error('Invalid prefix'); }
    const _hash = sc_0.loadUintBig(256);
    const _customPayload = sc_0.loadBit() ? sc_0.loadRef() : null;
    return { $$type: 'Refund' as const, hash: _hash, customPayload: _customPayload };
}

export function loadTupleRefund(source: TupleReader) {
    const _hash = source.readBigNumber();
    const _customPayload = source.readCellOpt();
    return { $$type: 'Refund' as const, hash: _hash, customPayload: _customPayload };
}

export function loadGetterTupleRefund(source: TupleReader) {
    const _hash = source.readBigNumber();
    const _customPayload = source.readCellOpt();
    return { $$type: 'Refund' as const, hash: _hash, customPayload: _customPayload };
}

export function storeTupleRefund(source: Refund) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.hash);
    builder.writeCell(source.customPayload);
    return builder.build();
}

export function dictValueParserRefund(): DictionaryValue<Refund> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeRefund(src)).endCell());
        },
        parse: (src) => {
            return loadRefund(src.loadRef().beginParse());
        }
    }
}

export type RefundOrder = {
    $$type: 'RefundOrder';
    hash: bigint;
    customPayload: Cell | null;
}

export function storeRefundOrder(src: RefundOrder) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1935855773, 32);
        b_0.storeUint(src.hash, 256);
        if (src.customPayload !== null && src.customPayload !== undefined) { b_0.storeBit(true).storeRef(src.customPayload); } else { b_0.storeBit(false); }
    };
}

export function loadRefundOrder(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1935855773) { throw Error('Invalid prefix'); }
    const _hash = sc_0.loadUintBig(256);
    const _customPayload = sc_0.loadBit() ? sc_0.loadRef() : null;
    return { $$type: 'RefundOrder' as const, hash: _hash, customPayload: _customPayload };
}

export function loadTupleRefundOrder(source: TupleReader) {
    const _hash = source.readBigNumber();
    const _customPayload = source.readCellOpt();
    return { $$type: 'RefundOrder' as const, hash: _hash, customPayload: _customPayload };
}

export function loadGetterTupleRefundOrder(source: TupleReader) {
    const _hash = source.readBigNumber();
    const _customPayload = source.readCellOpt();
    return { $$type: 'RefundOrder' as const, hash: _hash, customPayload: _customPayload };
}

export function storeTupleRefundOrder(source: RefundOrder) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.hash);
    builder.writeCell(source.customPayload);
    return builder.build();
}

export function dictValueParserRefundOrder(): DictionaryValue<RefundOrder> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeRefundOrder(src)).endCell());
        },
        parse: (src) => {
            return loadRefundOrder(src.loadRef().beginParse());
        }
    }
}

export type SetWhiteList = {
    $$type: 'SetWhiteList';
    resolver: Address;
    whitelistStatus: boolean;
}

export function storeSetWhiteList(src: SetWhiteList) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(2844130808, 32);
        b_0.storeAddress(src.resolver);
        b_0.storeBit(src.whitelistStatus);
    };
}

export function loadSetWhiteList(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 2844130808) { throw Error('Invalid prefix'); }
    const _resolver = sc_0.loadAddress();
    const _whitelistStatus = sc_0.loadBit();
    return { $$type: 'SetWhiteList' as const, resolver: _resolver, whitelistStatus: _whitelistStatus };
}

export function loadTupleSetWhiteList(source: TupleReader) {
    const _resolver = source.readAddress();
    const _whitelistStatus = source.readBoolean();
    return { $$type: 'SetWhiteList' as const, resolver: _resolver, whitelistStatus: _whitelistStatus };
}

export function loadGetterTupleSetWhiteList(source: TupleReader) {
    const _resolver = source.readAddress();
    const _whitelistStatus = source.readBoolean();
    return { $$type: 'SetWhiteList' as const, resolver: _resolver, whitelistStatus: _whitelistStatus };
}

export function storeTupleSetWhiteList(source: SetWhiteList) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.resolver);
    builder.writeBoolean(source.whitelistStatus);
    return builder.build();
}

export function dictValueParserSetWhiteList(): DictionaryValue<SetWhiteList> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeSetWhiteList(src)).endCell());
        },
        parse: (src) => {
            return loadSetWhiteList(src.loadRef().beginParse());
        }
    }
}

export type JettonNotifyWithActionRequest = {
    $$type: 'JettonNotifyWithActionRequest';
    queryId: bigint;
    amount: bigint;
    sender: Address;
    actionOpcode: bigint;
    actionPayload: Cell;
}

export function storeJettonNotifyWithActionRequest(src: JettonNotifyWithActionRequest) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1935855772, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeCoins(src.amount);
        b_0.storeAddress(src.sender);
        b_0.storeUint(src.actionOpcode, 32);
        b_0.storeRef(src.actionPayload);
    };
}

export function loadJettonNotifyWithActionRequest(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1935855772) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _amount = sc_0.loadCoins();
    const _sender = sc_0.loadAddress();
    const _actionOpcode = sc_0.loadUintBig(32);
    const _actionPayload = sc_0.loadRef();
    return { $$type: 'JettonNotifyWithActionRequest' as const, queryId: _queryId, amount: _amount, sender: _sender, actionOpcode: _actionOpcode, actionPayload: _actionPayload };
}

export function loadTupleJettonNotifyWithActionRequest(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _sender = source.readAddress();
    const _actionOpcode = source.readBigNumber();
    const _actionPayload = source.readCell();
    return { $$type: 'JettonNotifyWithActionRequest' as const, queryId: _queryId, amount: _amount, sender: _sender, actionOpcode: _actionOpcode, actionPayload: _actionPayload };
}

export function loadGetterTupleJettonNotifyWithActionRequest(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _sender = source.readAddress();
    const _actionOpcode = source.readBigNumber();
    const _actionPayload = source.readCell();
    return { $$type: 'JettonNotifyWithActionRequest' as const, queryId: _queryId, amount: _amount, sender: _sender, actionOpcode: _actionOpcode, actionPayload: _actionPayload };
}

export function storeTupleJettonNotifyWithActionRequest(source: JettonNotifyWithActionRequest) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeNumber(source.amount);
    builder.writeAddress(source.sender);
    builder.writeNumber(source.actionOpcode);
    builder.writeCell(source.actionPayload);
    return builder.build();
}

export function dictValueParserJettonNotifyWithActionRequest(): DictionaryValue<JettonNotifyWithActionRequest> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeJettonNotifyWithActionRequest(src)).endCell());
        },
        parse: (src) => {
            return loadJettonNotifyWithActionRequest(src.loadRef().beginParse());
        }
    }
}

export type GetWalletAddress = {
    $$type: 'GetWalletAddress';
    queryId: bigint;
    owner: Address;
}

export function storeGetWalletAddress(src: GetWalletAddress) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(801842850, 32);
        b_0.storeInt(src.queryId, 257);
        b_0.storeAddress(src.owner);
    };
}

export function loadGetWalletAddress(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 801842850) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadIntBig(257);
    const _owner = sc_0.loadAddress();
    return { $$type: 'GetWalletAddress' as const, queryId: _queryId, owner: _owner };
}

export function loadTupleGetWalletAddress(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _owner = source.readAddress();
    return { $$type: 'GetWalletAddress' as const, queryId: _queryId, owner: _owner };
}

export function loadGetterTupleGetWalletAddress(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _owner = source.readAddress();
    return { $$type: 'GetWalletAddress' as const, queryId: _queryId, owner: _owner };
}

export function storeTupleGetWalletAddress(source: GetWalletAddress) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeAddress(source.owner);
    return builder.build();
}

export function dictValueParserGetWalletAddress(): DictionaryValue<GetWalletAddress> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeGetWalletAddress(src)).endCell());
        },
        parse: (src) => {
            return loadGetWalletAddress(src.loadRef().beginParse());
        }
    }
}

export type CalculateOutput = {
    $$type: 'CalculateOutput';
    protocolFeeAmount: bigint;
    integratorFeeAmount: bigint;
    outputAmount: bigint;
}

export function storeCalculateOutput(src: CalculateOutput) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(src.protocolFeeAmount, 64);
        b_0.storeUint(src.integratorFeeAmount, 64);
        b_0.storeUint(src.outputAmount, 64);
    };
}

export function loadCalculateOutput(slice: Slice) {
    const sc_0 = slice;
    const _protocolFeeAmount = sc_0.loadUintBig(64);
    const _integratorFeeAmount = sc_0.loadUintBig(64);
    const _outputAmount = sc_0.loadUintBig(64);
    return { $$type: 'CalculateOutput' as const, protocolFeeAmount: _protocolFeeAmount, integratorFeeAmount: _integratorFeeAmount, outputAmount: _outputAmount };
}

export function loadTupleCalculateOutput(source: TupleReader) {
    const _protocolFeeAmount = source.readBigNumber();
    const _integratorFeeAmount = source.readBigNumber();
    const _outputAmount = source.readBigNumber();
    return { $$type: 'CalculateOutput' as const, protocolFeeAmount: _protocolFeeAmount, integratorFeeAmount: _integratorFeeAmount, outputAmount: _outputAmount };
}

export function loadGetterTupleCalculateOutput(source: TupleReader) {
    const _protocolFeeAmount = source.readBigNumber();
    const _integratorFeeAmount = source.readBigNumber();
    const _outputAmount = source.readBigNumber();
    return { $$type: 'CalculateOutput' as const, protocolFeeAmount: _protocolFeeAmount, integratorFeeAmount: _integratorFeeAmount, outputAmount: _outputAmount };
}

export function storeTupleCalculateOutput(source: CalculateOutput) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.protocolFeeAmount);
    builder.writeNumber(source.integratorFeeAmount);
    builder.writeNumber(source.outputAmount);
    return builder.build();
}

export function dictValueParserCalculateOutput(): DictionaryValue<CalculateOutput> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeCalculateOutput(src)).endCell());
        },
        parse: (src) => {
            return loadCalculateOutput(src.loadRef().beginParse());
        }
    }
}

export type PointAndTimeDelta = {
    $$type: 'PointAndTimeDelta';
    rateBump: bigint;
    timeDelta: bigint;
}

export function storePointAndTimeDelta(src: PointAndTimeDelta) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(src.rateBump, 16);
        b_0.storeUint(src.timeDelta, 16);
    };
}

export function loadPointAndTimeDelta(slice: Slice) {
    const sc_0 = slice;
    const _rateBump = sc_0.loadUintBig(16);
    const _timeDelta = sc_0.loadUintBig(16);
    return { $$type: 'PointAndTimeDelta' as const, rateBump: _rateBump, timeDelta: _timeDelta };
}

export function loadTuplePointAndTimeDelta(source: TupleReader) {
    const _rateBump = source.readBigNumber();
    const _timeDelta = source.readBigNumber();
    return { $$type: 'PointAndTimeDelta' as const, rateBump: _rateBump, timeDelta: _timeDelta };
}

export function loadGetterTuplePointAndTimeDelta(source: TupleReader) {
    const _rateBump = source.readBigNumber();
    const _timeDelta = source.readBigNumber();
    return { $$type: 'PointAndTimeDelta' as const, rateBump: _rateBump, timeDelta: _timeDelta };
}

export function storeTuplePointAndTimeDelta(source: PointAndTimeDelta) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.rateBump);
    builder.writeNumber(source.timeDelta);
    return builder.build();
}

export function dictValueParserPointAndTimeDelta(): DictionaryValue<PointAndTimeDelta> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storePointAndTimeDelta(src)).endCell());
        },
        parse: (src) => {
            return loadPointAndTimeDelta(src.loadRef().beginParse());
        }
    }
}

export type OrderConfig = {
    $$type: 'OrderConfig';
    id: bigint;
    srcJettonAddress: Address;
    senderPubKey: Address;
    receiverPubKey: Address;
    hashlock: bigint;
    timelock: bigint;
    amount: bigint;
    finalized: boolean;
    partialFills: Dictionary<bigint, bigint>;
    totalFilled: bigint;
    direction: bigint;
}

export function storeOrderConfig(src: OrderConfig) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(src.id, 32);
        b_0.storeAddress(src.srcJettonAddress);
        b_0.storeAddress(src.senderPubKey);
        b_0.storeAddress(src.receiverPubKey);
        const b_1 = new Builder();
        b_1.storeUint(src.hashlock, 256);
        b_1.storeUint(src.timelock, 32);
        b_1.storeUint(src.amount, 64);
        b_1.storeBit(src.finalized);
        b_1.storeDict(src.partialFills, Dictionary.Keys.BigUint(256), Dictionary.Values.BigUint(64));
        b_1.storeUint(src.totalFilled, 64);
        b_1.storeUint(src.direction, 8);
        b_0.storeRef(b_1.endCell());
    };
}

export function loadOrderConfig(slice: Slice) {
    const sc_0 = slice;
    const _id = sc_0.loadUintBig(32);
    const _srcJettonAddress = sc_0.loadAddress();
    const _senderPubKey = sc_0.loadAddress();
    const _receiverPubKey = sc_0.loadAddress();
    const sc_1 = sc_0.loadRef().beginParse();
    const _hashlock = sc_1.loadUintBig(256);
    const _timelock = sc_1.loadUintBig(32);
    const _amount = sc_1.loadUintBig(64);
    const _finalized = sc_1.loadBit();
    const _partialFills = Dictionary.load(Dictionary.Keys.BigUint(256), Dictionary.Values.BigUint(64), sc_1);
    const _totalFilled = sc_1.loadUintBig(64);
    const _direction = sc_1.loadUintBig(8);
    return { $$type: 'OrderConfig' as const, id: _id, srcJettonAddress: _srcJettonAddress, senderPubKey: _senderPubKey, receiverPubKey: _receiverPubKey, hashlock: _hashlock, timelock: _timelock, amount: _amount, finalized: _finalized, partialFills: _partialFills, totalFilled: _totalFilled, direction: _direction };
}

export function loadTupleOrderConfig(source: TupleReader) {
    const _id = source.readBigNumber();
    const _srcJettonAddress = source.readAddress();
    const _senderPubKey = source.readAddress();
    const _receiverPubKey = source.readAddress();
    const _hashlock = source.readBigNumber();
    const _timelock = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _finalized = source.readBoolean();
    const _partialFills = Dictionary.loadDirect(Dictionary.Keys.BigUint(256), Dictionary.Values.BigUint(64), source.readCellOpt());
    const _totalFilled = source.readBigNumber();
    const _direction = source.readBigNumber();
    return { $$type: 'OrderConfig' as const, id: _id, srcJettonAddress: _srcJettonAddress, senderPubKey: _senderPubKey, receiverPubKey: _receiverPubKey, hashlock: _hashlock, timelock: _timelock, amount: _amount, finalized: _finalized, partialFills: _partialFills, totalFilled: _totalFilled, direction: _direction };
}

export function loadGetterTupleOrderConfig(source: TupleReader) {
    const _id = source.readBigNumber();
    const _srcJettonAddress = source.readAddress();
    const _senderPubKey = source.readAddress();
    const _receiverPubKey = source.readAddress();
    const _hashlock = source.readBigNumber();
    const _timelock = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _finalized = source.readBoolean();
    const _partialFills = Dictionary.loadDirect(Dictionary.Keys.BigUint(256), Dictionary.Values.BigUint(64), source.readCellOpt());
    const _totalFilled = source.readBigNumber();
    const _direction = source.readBigNumber();
    return { $$type: 'OrderConfig' as const, id: _id, srcJettonAddress: _srcJettonAddress, senderPubKey: _senderPubKey, receiverPubKey: _receiverPubKey, hashlock: _hashlock, timelock: _timelock, amount: _amount, finalized: _finalized, partialFills: _partialFills, totalFilled: _totalFilled, direction: _direction };
}

export function storeTupleOrderConfig(source: OrderConfig) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.id);
    builder.writeAddress(source.srcJettonAddress);
    builder.writeAddress(source.senderPubKey);
    builder.writeAddress(source.receiverPubKey);
    builder.writeNumber(source.hashlock);
    builder.writeNumber(source.timelock);
    builder.writeNumber(source.amount);
    builder.writeBoolean(source.finalized);
    builder.writeCell(source.partialFills.size > 0 ? beginCell().storeDictDirect(source.partialFills, Dictionary.Keys.BigUint(256), Dictionary.Values.BigUint(64)).endCell() : null);
    builder.writeNumber(source.totalFilled);
    builder.writeNumber(source.direction);
    return builder.build();
}

export function dictValueParserOrderConfig(): DictionaryValue<OrderConfig> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeOrderConfig(src)).endCell());
        },
        parse: (src) => {
            return loadOrderConfig(src.loadRef().beginParse());
        }
    }
}

export type Order = {
    $$type: 'Order';
    id: bigint;
    srcJettonAddress: Address;
    senderPubKey: Address;
    hashlock: bigint;
    timelock: bigint;
    amount: bigint;
    finalized: boolean;
    partialFills: Dictionary<bigint, bigint>;
    totalFilled: bigint;
    direction: bigint;
}

export function storeOrder(src: Order) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(src.id, 32);
        b_0.storeAddress(src.srcJettonAddress);
        b_0.storeAddress(src.senderPubKey);
        b_0.storeUint(src.hashlock, 256);
        b_0.storeUint(src.timelock, 32);
        b_0.storeUint(src.amount, 64);
        b_0.storeBit(src.finalized);
        b_0.storeDict(src.partialFills, Dictionary.Keys.BigUint(256), Dictionary.Values.BigUint(64));
        b_0.storeUint(src.totalFilled, 64);
        b_0.storeUint(src.direction, 8);
    };
}

export function loadOrder(slice: Slice) {
    const sc_0 = slice;
    const _id = sc_0.loadUintBig(32);
    const _srcJettonAddress = sc_0.loadAddress();
    const _senderPubKey = sc_0.loadAddress();
    const _hashlock = sc_0.loadUintBig(256);
    const _timelock = sc_0.loadUintBig(32);
    const _amount = sc_0.loadUintBig(64);
    const _finalized = sc_0.loadBit();
    const _partialFills = Dictionary.load(Dictionary.Keys.BigUint(256), Dictionary.Values.BigUint(64), sc_0);
    const _totalFilled = sc_0.loadUintBig(64);
    const _direction = sc_0.loadUintBig(8);
    return { $$type: 'Order' as const, id: _id, srcJettonAddress: _srcJettonAddress, senderPubKey: _senderPubKey, hashlock: _hashlock, timelock: _timelock, amount: _amount, finalized: _finalized, partialFills: _partialFills, totalFilled: _totalFilled, direction: _direction };
}

export function loadTupleOrder(source: TupleReader) {
    const _id = source.readBigNumber();
    const _srcJettonAddress = source.readAddress();
    const _senderPubKey = source.readAddress();
    const _hashlock = source.readBigNumber();
    const _timelock = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _finalized = source.readBoolean();
    const _partialFills = Dictionary.loadDirect(Dictionary.Keys.BigUint(256), Dictionary.Values.BigUint(64), source.readCellOpt());
    const _totalFilled = source.readBigNumber();
    const _direction = source.readBigNumber();
    return { $$type: 'Order' as const, id: _id, srcJettonAddress: _srcJettonAddress, senderPubKey: _senderPubKey, hashlock: _hashlock, timelock: _timelock, amount: _amount, finalized: _finalized, partialFills: _partialFills, totalFilled: _totalFilled, direction: _direction };
}

export function loadGetterTupleOrder(source: TupleReader) {
    const _id = source.readBigNumber();
    const _srcJettonAddress = source.readAddress();
    const _senderPubKey = source.readAddress();
    const _hashlock = source.readBigNumber();
    const _timelock = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _finalized = source.readBoolean();
    const _partialFills = Dictionary.loadDirect(Dictionary.Keys.BigUint(256), Dictionary.Values.BigUint(64), source.readCellOpt());
    const _totalFilled = source.readBigNumber();
    const _direction = source.readBigNumber();
    return { $$type: 'Order' as const, id: _id, srcJettonAddress: _srcJettonAddress, senderPubKey: _senderPubKey, hashlock: _hashlock, timelock: _timelock, amount: _amount, finalized: _finalized, partialFills: _partialFills, totalFilled: _totalFilled, direction: _direction };
}

export function storeTupleOrder(source: Order) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.id);
    builder.writeAddress(source.srcJettonAddress);
    builder.writeAddress(source.senderPubKey);
    builder.writeNumber(source.hashlock);
    builder.writeNumber(source.timelock);
    builder.writeNumber(source.amount);
    builder.writeBoolean(source.finalized);
    builder.writeCell(source.partialFills.size > 0 ? beginCell().storeDictDirect(source.partialFills, Dictionary.Keys.BigUint(256), Dictionary.Values.BigUint(64)).endCell() : null);
    builder.writeNumber(source.totalFilled);
    builder.writeNumber(source.direction);
    return builder.build();
}

export function dictValueParserOrder(): DictionaryValue<Order> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeOrder(src)).endCell());
        },
        parse: (src) => {
            return loadOrder(src.loadRef().beginParse());
        }
    }
}

export type EscrowContract = {
    $$type: 'EscrowContract';
    chainId: bigint;
    contractAddress: Address;
    deployed: boolean;
    totalOrders: bigint;
}

export function storeEscrowContract(src: EscrowContract) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(src.chainId, 32);
        b_0.storeAddress(src.contractAddress);
        b_0.storeBit(src.deployed);
        b_0.storeUint(src.totalOrders, 32);
    };
}

export function loadEscrowContract(slice: Slice) {
    const sc_0 = slice;
    const _chainId = sc_0.loadUintBig(32);
    const _contractAddress = sc_0.loadAddress();
    const _deployed = sc_0.loadBit();
    const _totalOrders = sc_0.loadUintBig(32);
    return { $$type: 'EscrowContract' as const, chainId: _chainId, contractAddress: _contractAddress, deployed: _deployed, totalOrders: _totalOrders };
}

export function loadTupleEscrowContract(source: TupleReader) {
    const _chainId = source.readBigNumber();
    const _contractAddress = source.readAddress();
    const _deployed = source.readBoolean();
    const _totalOrders = source.readBigNumber();
    return { $$type: 'EscrowContract' as const, chainId: _chainId, contractAddress: _contractAddress, deployed: _deployed, totalOrders: _totalOrders };
}

export function loadGetterTupleEscrowContract(source: TupleReader) {
    const _chainId = source.readBigNumber();
    const _contractAddress = source.readAddress();
    const _deployed = source.readBoolean();
    const _totalOrders = source.readBigNumber();
    return { $$type: 'EscrowContract' as const, chainId: _chainId, contractAddress: _contractAddress, deployed: _deployed, totalOrders: _totalOrders };
}

export function storeTupleEscrowContract(source: EscrowContract) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.chainId);
    builder.writeAddress(source.contractAddress);
    builder.writeBoolean(source.deployed);
    builder.writeNumber(source.totalOrders);
    return builder.build();
}

export function dictValueParserEscrowContract(): DictionaryValue<EscrowContract> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeEscrowContract(src)).endCell());
        },
        parse: (src) => {
            return loadEscrowContract(src.loadRef().beginParse());
        }
    }
}

export type RelayerData = {
    $$type: 'RelayerData';
    address: Address;
    whitelisted: boolean;
    totalResolves: bigint;
    successRate: bigint;
}

export function storeRelayerData(src: RelayerData) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeAddress(src.address);
        b_0.storeBit(src.whitelisted);
        b_0.storeUint(src.totalResolves, 32);
        b_0.storeUint(src.successRate, 16);
    };
}

export function loadRelayerData(slice: Slice) {
    const sc_0 = slice;
    const _address = sc_0.loadAddress();
    const _whitelisted = sc_0.loadBit();
    const _totalResolves = sc_0.loadUintBig(32);
    const _successRate = sc_0.loadUintBig(16);
    return { $$type: 'RelayerData' as const, address: _address, whitelisted: _whitelisted, totalResolves: _totalResolves, successRate: _successRate };
}

export function loadTupleRelayerData(source: TupleReader) {
    const _address = source.readAddress();
    const _whitelisted = source.readBoolean();
    const _totalResolves = source.readBigNumber();
    const _successRate = source.readBigNumber();
    return { $$type: 'RelayerData' as const, address: _address, whitelisted: _whitelisted, totalResolves: _totalResolves, successRate: _successRate };
}

export function loadGetterTupleRelayerData(source: TupleReader) {
    const _address = source.readAddress();
    const _whitelisted = source.readBoolean();
    const _totalResolves = source.readBigNumber();
    const _successRate = source.readBigNumber();
    return { $$type: 'RelayerData' as const, address: _address, whitelisted: _whitelisted, totalResolves: _totalResolves, successRate: _successRate };
}

export function storeTupleRelayerData(source: RelayerData) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.address);
    builder.writeBoolean(source.whitelisted);
    builder.writeNumber(source.totalResolves);
    builder.writeNumber(source.successRate);
    return builder.build();
}

export function dictValueParserRelayerData(): DictionaryValue<RelayerData> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeRelayerData(src)).endCell());
        },
        parse: (src) => {
            return loadRelayerData(src.loadRef().beginParse());
        }
    }
}

export type JettonWalletData = {
    $$type: 'JettonWalletData';
    balance: bigint;
    ownerAddress: Address;
    jettonMasterAddress: Address;
    jettonWalletCode: Cell;
}

export function storeJettonWalletData(src: JettonWalletData) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeCoins(src.balance);
        b_0.storeAddress(src.ownerAddress);
        b_0.storeAddress(src.jettonMasterAddress);
        b_0.storeRef(src.jettonWalletCode);
    };
}

export function loadJettonWalletData(slice: Slice) {
    const sc_0 = slice;
    const _balance = sc_0.loadCoins();
    const _ownerAddress = sc_0.loadAddress();
    const _jettonMasterAddress = sc_0.loadAddress();
    const _jettonWalletCode = sc_0.loadRef();
    return { $$type: 'JettonWalletData' as const, balance: _balance, ownerAddress: _ownerAddress, jettonMasterAddress: _jettonMasterAddress, jettonWalletCode: _jettonWalletCode };
}

export function loadTupleJettonWalletData(source: TupleReader) {
    const _balance = source.readBigNumber();
    const _ownerAddress = source.readAddress();
    const _jettonMasterAddress = source.readAddress();
    const _jettonWalletCode = source.readCell();
    return { $$type: 'JettonWalletData' as const, balance: _balance, ownerAddress: _ownerAddress, jettonMasterAddress: _jettonMasterAddress, jettonWalletCode: _jettonWalletCode };
}

export function loadGetterTupleJettonWalletData(source: TupleReader) {
    const _balance = source.readBigNumber();
    const _ownerAddress = source.readAddress();
    const _jettonMasterAddress = source.readAddress();
    const _jettonWalletCode = source.readCell();
    return { $$type: 'JettonWalletData' as const, balance: _balance, ownerAddress: _ownerAddress, jettonMasterAddress: _jettonMasterAddress, jettonWalletCode: _jettonWalletCode };
}

export function storeTupleJettonWalletData(source: JettonWalletData) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.balance);
    builder.writeAddress(source.ownerAddress);
    builder.writeAddress(source.jettonMasterAddress);
    builder.writeCell(source.jettonWalletCode);
    return builder.build();
}

export function dictValueParserJettonWalletData(): DictionaryValue<JettonWalletData> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeJettonWalletData(src)).endCell());
        },
        parse: (src) => {
            return loadJettonWalletData(src.loadRef().beginParse());
        }
    }
}

export type SendViaJettonTransfer = {
    $$type: 'SendViaJettonTransfer';
    queryId: bigint;
    amount: bigint;
    destination: Address;
    responseDestination: Address | null;
    customPayload: Cell | null;
    forwardTonAmount: bigint;
    forwardPayload: Slice;
}

export function storeSendViaJettonTransfer(src: SendViaJettonTransfer) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(260734629, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeCoins(src.amount);
        b_0.storeAddress(src.destination);
        b_0.storeAddress(src.responseDestination);
        if (src.customPayload !== null && src.customPayload !== undefined) { b_0.storeBit(true).storeRef(src.customPayload); } else { b_0.storeBit(false); }
        b_0.storeCoins(src.forwardTonAmount);
        b_0.storeBuilder(src.forwardPayload.asBuilder());
    };
}

export function loadSendViaJettonTransfer(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 260734629) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _amount = sc_0.loadCoins();
    const _destination = sc_0.loadAddress();
    const _responseDestination = sc_0.loadMaybeAddress();
    const _customPayload = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _forwardTonAmount = sc_0.loadCoins();
    const _forwardPayload = sc_0;
    return { $$type: 'SendViaJettonTransfer' as const, queryId: _queryId, amount: _amount, destination: _destination, responseDestination: _responseDestination, customPayload: _customPayload, forwardTonAmount: _forwardTonAmount, forwardPayload: _forwardPayload };
}

export function loadTupleSendViaJettonTransfer(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _destination = source.readAddress();
    const _responseDestination = source.readAddressOpt();
    const _customPayload = source.readCellOpt();
    const _forwardTonAmount = source.readBigNumber();
    const _forwardPayload = source.readCell().asSlice();
    return { $$type: 'SendViaJettonTransfer' as const, queryId: _queryId, amount: _amount, destination: _destination, responseDestination: _responseDestination, customPayload: _customPayload, forwardTonAmount: _forwardTonAmount, forwardPayload: _forwardPayload };
}

export function loadGetterTupleSendViaJettonTransfer(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _destination = source.readAddress();
    const _responseDestination = source.readAddressOpt();
    const _customPayload = source.readCellOpt();
    const _forwardTonAmount = source.readBigNumber();
    const _forwardPayload = source.readCell().asSlice();
    return { $$type: 'SendViaJettonTransfer' as const, queryId: _queryId, amount: _amount, destination: _destination, responseDestination: _responseDestination, customPayload: _customPayload, forwardTonAmount: _forwardTonAmount, forwardPayload: _forwardPayload };
}

export function storeTupleSendViaJettonTransfer(source: SendViaJettonTransfer) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeNumber(source.amount);
    builder.writeAddress(source.destination);
    builder.writeAddress(source.responseDestination);
    builder.writeCell(source.customPayload);
    builder.writeNumber(source.forwardTonAmount);
    builder.writeSlice(source.forwardPayload.asCell());
    return builder.build();
}

export function dictValueParserSendViaJettonTransfer(): DictionaryValue<SendViaJettonTransfer> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeSendViaJettonTransfer(src)).endCell());
        },
        parse: (src) => {
            return loadSendViaJettonTransfer(src.loadRef().beginParse());
        }
    }
}

export type TonFusion$Data = {
    $$type: 'TonFusion$Data';
    owner: Address;
    escrowLock: Dictionary<bigint, OrderConfig>;
    escrowOrder: Dictionary<bigint, Order>;
    jettons: Dictionary<Address, Cell>;
    jettonAccount: Dictionary<Address, Address>;
    whiteLists: Dictionary<Address, boolean>;
    relayers: Dictionary<Address, RelayerData>;
    escrowContracts: Dictionary<number, EscrowContract>;
    totalOrders: bigint;
    totalVolume: bigint;
    totalResolves: bigint;
}

export function storeTonFusion$Data(src: TonFusion$Data) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeAddress(src.owner);
        b_0.storeDict(src.escrowLock, Dictionary.Keys.BigUint(256), dictValueParserOrderConfig());
        b_0.storeDict(src.escrowOrder, Dictionary.Keys.BigUint(256), dictValueParserOrder());
        const b_1 = new Builder();
        b_1.storeDict(src.jettons, Dictionary.Keys.Address(), Dictionary.Values.Cell());
        b_1.storeDict(src.jettonAccount, Dictionary.Keys.Address(), Dictionary.Values.Address());
        b_1.storeDict(src.whiteLists, Dictionary.Keys.Address(), Dictionary.Values.Bool());
        const b_2 = new Builder();
        b_2.storeDict(src.relayers, Dictionary.Keys.Address(), dictValueParserRelayerData());
        b_2.storeDict(src.escrowContracts, Dictionary.Keys.Uint(32), dictValueParserEscrowContract());
        b_2.storeUint(src.totalOrders, 32);
        b_2.storeUint(src.totalVolume, 64);
        b_2.storeUint(src.totalResolves, 32);
        b_1.storeRef(b_2.endCell());
        b_0.storeRef(b_1.endCell());
    };
}

export function loadTonFusion$Data(slice: Slice) {
    const sc_0 = slice;
    const _owner = sc_0.loadAddress();
    const _escrowLock = Dictionary.load(Dictionary.Keys.BigUint(256), dictValueParserOrderConfig(), sc_0);
    const _escrowOrder = Dictionary.load(Dictionary.Keys.BigUint(256), dictValueParserOrder(), sc_0);
    const sc_1 = sc_0.loadRef().beginParse();
    const _jettons = Dictionary.load(Dictionary.Keys.Address(), Dictionary.Values.Cell(), sc_1);
    const _jettonAccount = Dictionary.load(Dictionary.Keys.Address(), Dictionary.Values.Address(), sc_1);
    const _whiteLists = Dictionary.load(Dictionary.Keys.Address(), Dictionary.Values.Bool(), sc_1);
    const sc_2 = sc_1.loadRef().beginParse();
    const _relayers = Dictionary.load(Dictionary.Keys.Address(), dictValueParserRelayerData(), sc_2);
    const _escrowContracts = Dictionary.load(Dictionary.Keys.Uint(32), dictValueParserEscrowContract(), sc_2);
    const _totalOrders = sc_2.loadUintBig(32);
    const _totalVolume = sc_2.loadUintBig(64);
    const _totalResolves = sc_2.loadUintBig(32);
    return { $$type: 'TonFusion$Data' as const, owner: _owner, escrowLock: _escrowLock, escrowOrder: _escrowOrder, jettons: _jettons, jettonAccount: _jettonAccount, whiteLists: _whiteLists, relayers: _relayers, escrowContracts: _escrowContracts, totalOrders: _totalOrders, totalVolume: _totalVolume, totalResolves: _totalResolves };
}

export function loadTupleTonFusion$Data(source: TupleReader) {
    const _owner = source.readAddress();
    const _escrowLock = Dictionary.loadDirect(Dictionary.Keys.BigUint(256), dictValueParserOrderConfig(), source.readCellOpt());
    const _escrowOrder = Dictionary.loadDirect(Dictionary.Keys.BigUint(256), dictValueParserOrder(), source.readCellOpt());
    const _jettons = Dictionary.loadDirect(Dictionary.Keys.Address(), Dictionary.Values.Cell(), source.readCellOpt());
    const _jettonAccount = Dictionary.loadDirect(Dictionary.Keys.Address(), Dictionary.Values.Address(), source.readCellOpt());
    const _whiteLists = Dictionary.loadDirect(Dictionary.Keys.Address(), Dictionary.Values.Bool(), source.readCellOpt());
    const _relayers = Dictionary.loadDirect(Dictionary.Keys.Address(), dictValueParserRelayerData(), source.readCellOpt());
    const _escrowContracts = Dictionary.loadDirect(Dictionary.Keys.Uint(32), dictValueParserEscrowContract(), source.readCellOpt());
    const _totalOrders = source.readBigNumber();
    const _totalVolume = source.readBigNumber();
    const _totalResolves = source.readBigNumber();
    return { $$type: 'TonFusion$Data' as const, owner: _owner, escrowLock: _escrowLock, escrowOrder: _escrowOrder, jettons: _jettons, jettonAccount: _jettonAccount, whiteLists: _whiteLists, relayers: _relayers, escrowContracts: _escrowContracts, totalOrders: _totalOrders, totalVolume: _totalVolume, totalResolves: _totalResolves };
}

export function loadGetterTupleTonFusion$Data(source: TupleReader) {
    const _owner = source.readAddress();
    const _escrowLock = Dictionary.loadDirect(Dictionary.Keys.BigUint(256), dictValueParserOrderConfig(), source.readCellOpt());
    const _escrowOrder = Dictionary.loadDirect(Dictionary.Keys.BigUint(256), dictValueParserOrder(), source.readCellOpt());
    const _jettons = Dictionary.loadDirect(Dictionary.Keys.Address(), Dictionary.Values.Cell(), source.readCellOpt());
    const _jettonAccount = Dictionary.loadDirect(Dictionary.Keys.Address(), Dictionary.Values.Address(), source.readCellOpt());
    const _whiteLists = Dictionary.loadDirect(Dictionary.Keys.Address(), Dictionary.Values.Bool(), source.readCellOpt());
    const _relayers = Dictionary.loadDirect(Dictionary.Keys.Address(), dictValueParserRelayerData(), source.readCellOpt());
    const _escrowContracts = Dictionary.loadDirect(Dictionary.Keys.Uint(32), dictValueParserEscrowContract(), source.readCellOpt());
    const _totalOrders = source.readBigNumber();
    const _totalVolume = source.readBigNumber();
    const _totalResolves = source.readBigNumber();
    return { $$type: 'TonFusion$Data' as const, owner: _owner, escrowLock: _escrowLock, escrowOrder: _escrowOrder, jettons: _jettons, jettonAccount: _jettonAccount, whiteLists: _whiteLists, relayers: _relayers, escrowContracts: _escrowContracts, totalOrders: _totalOrders, totalVolume: _totalVolume, totalResolves: _totalResolves };
}

export function storeTupleTonFusion$Data(source: TonFusion$Data) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.owner);
    builder.writeCell(source.escrowLock.size > 0 ? beginCell().storeDictDirect(source.escrowLock, Dictionary.Keys.BigUint(256), dictValueParserOrderConfig()).endCell() : null);
    builder.writeCell(source.escrowOrder.size > 0 ? beginCell().storeDictDirect(source.escrowOrder, Dictionary.Keys.BigUint(256), dictValueParserOrder()).endCell() : null);
    builder.writeCell(source.jettons.size > 0 ? beginCell().storeDictDirect(source.jettons, Dictionary.Keys.Address(), Dictionary.Values.Cell()).endCell() : null);
    builder.writeCell(source.jettonAccount.size > 0 ? beginCell().storeDictDirect(source.jettonAccount, Dictionary.Keys.Address(), Dictionary.Values.Address()).endCell() : null);
    builder.writeCell(source.whiteLists.size > 0 ? beginCell().storeDictDirect(source.whiteLists, Dictionary.Keys.Address(), Dictionary.Values.Bool()).endCell() : null);
    builder.writeCell(source.relayers.size > 0 ? beginCell().storeDictDirect(source.relayers, Dictionary.Keys.Address(), dictValueParserRelayerData()).endCell() : null);
    builder.writeCell(source.escrowContracts.size > 0 ? beginCell().storeDictDirect(source.escrowContracts, Dictionary.Keys.Uint(32), dictValueParserEscrowContract()).endCell() : null);
    builder.writeNumber(source.totalOrders);
    builder.writeNumber(source.totalVolume);
    builder.writeNumber(source.totalResolves);
    return builder.build();
}

export function dictValueParserTonFusion$Data(): DictionaryValue<TonFusion$Data> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeTonFusion$Data(src)).endCell());
        },
        parse: (src) => {
            return loadTonFusion$Data(src.loadRef().beginParse());
        }
    }
}

 type TonFusion_init_args = {
    $$type: 'TonFusion_init_args';
}

function initTonFusion_init_args(src: TonFusion_init_args) {
    return (builder: Builder) => {
        const b_0 = builder;
    };
}

async function TonFusion_init() {
    const __code = Cell.fromHex('b5ee9c72410233010011f3000110ff0020e303f2c80b0103f83001d072d721d200d200fa4021103450666f04f86102f862ed44d0d200018e23fa40f404d401d0f404f404f404d430d0f404f404f404d31fd33fd31f30109b109a6c1b9f306d6d6d6d6d6d6d705300f8425590e20c925f0ce0702bd74920c21f95310bd31f0cde218210a985fdf8bae3022182107362d09ebae3022102030400d05b0afa40d20030f84252b0c705b3f2d056102581010b5971216e955b59f4593098c801cf004133f441e2108a107910681057104644554313c87f01ca0055a050abce18f40006c8f40015f40013f40001c8f40012f40012f40013cb1f13cb3f13cb1f12cdcdc9ed5400f05b0afa4030f84252a0c705b3f2d0567f7053025520431381010b5024c855305034ceca00cb1fcb0fc9103512206e953059f45930944133f413e2108a107910681057104610355034c87f01ca0055a050abce18f40006c8f40015f40013f40001c8f40012f40012f40013cb1f13cb3f13cb1f12cdcdc9ed5404c882107362d09cba8f485b0ad33f31fa0031fa40d31fd430218210f512f7dfbae30fc87f01ca0055a050abce18f40006c8f40015f40013f40001c8f40012f40012f40013cb1f13cb3f13cb1f12cdcdc9ed54e021821050635fd2bae302218210e49e1dcbba0508131603ae3120d0d31f018210f512f7dfbaf2e081db3c0bd4f4044ddd0dd1550b1a5f0a324300db3cf842c7058e92109b108a107910681057104610354430db3c8e1830f842c8cf8508ce70cf0b6ec98042fb00f2c056108a5517e2250f0603e6d0d31f018210f512f7dfbaf2e081db3c0bd4f4044ddd0dd1550b303181010bf842561259714133f40a6fa19401d70030925b6de27f216e925b7091bae2f2d057f82326bef2d04b561483072859f40f6fa192306ddf206e92306d8e87d0db3c6c1b6f0be26eb3f2d05a11127081010b52b2111525250701c4206e953059f45930944133f413e281010bf8420211130252b0206e953059f4593096c8ce4133f441e2107a10691058104a8307c82b516d106c5045103c020111160155a0db3cc9103d12206e953059f45b30944133f417e203a4502aa010291067010d03c02182107362d09cba8f54322082108b341822ba8e9330109b108a107910681057104610354430db3c8eb3821062239978ba8e92109b108a107910681057104610354430db3c8e1530f842c8cf8508ce70cf0b6ec98042fb00108a5517e2e2e30d090b0e03f6d0d31f0182108b341822baf2e081db3c0bd401d0fa40f40430102d0dd1550b5f0381010bf842561159714133f40a6fa19401d70030925b6de27f216e925b7091bae2f2d057f82325bef2d04b561383072759f40f6fa192306ddf206e92306d8e87d0db3c6c1b6f0be26eb3f2d05a1069105810471039718307c82b25250a014c516d106c5045103c0255a0db3cc9103d12206e953059f45b30944133f417e203a4502aa049000d03f6d0d31f01821062239978baf2e081db3c0bd31ff4044ddd0dd1550b5f0381010bf842561159714133f40a6fa19401d70030925b6de27f216e925b7091bae2f2d057f82325bef2d04b561383072759f40f6fa192306ddf206e92306d8e87d0db3c6c1b6f0be26eb3f2d05a1069105810471039708307c82b516d106c25250c01445045103c0255a0db3cc9103d12206e953059f45b30944133f417e203a4502aa049000d004050abcb1f18ce16ce14ce02c8cbffcb1f12cb3f12ca0012f40012cb3f12cb07cd02fe3120d0d31f0182107362d09cbaf2e081d401d0d31ffa40fa40d3ffd31fd33fd200f404d33fd30755900ad4f4043010ab109a10891078106710561045103410230cd1550a195f09324300db3cf842c7058e92109b108a107910681057104610354430db3c8e1830f842c8cf8508ce70cf0b6ec98042fb00f2c056108a5517e20f10007a70541323c855305043fa02ce12ceccc9705920f90022f9005ad76501d76582020134c8cb17cb0fcb0fcbffcbff71f90400c87401cb0212ca07cbffc9d001e8d0d31f0182107362d09cbaf2e081d401d0d31ffa40fa40d3ffd31fd33fd200f404d33fd30755900ad4f4043010ab109a10891078106710561045103410230cd1550a303181010bf842561159714133f40a6fa19401d70030925b6de27f216e925b7091bae2f2d057f82326bef2d04b56128307281101f659f40f6fa192306ddf206e92306d8e1bd0d31ffa40fa40d3ffd31fd33fd200f404d33fd30755906c1a6f0ae26eb3f2d05a11117281010b52a21114206e953059f45930944133f413e281010bf8420211120252a0206e953059f4593096c8ce4133f441e21069105810478307c82b516a106c5045103c02011115011200685590509acb1f17ce15ce13cbffcb1fcb3fca00f400cb3fcb07c91c13206e953059f45b30944133f417e203a45029a01028106701019a5b0ad3ffd3fff4043010bd10ac109b108a10791068105710461035db3cc87f01ca0055a050abce18f40006c8f40015f40013f40001c8f40012f40012f40013cb1f13cb3f13cb1f12cdcdc9ed541403a63083072c0259f40f6fa192306ddf206e92306d8e87d0db3c6c1b6f0be2206ef2d058206ef2d0806f2b2bdb3cf82327bcf2d04b04f2d05b5136bdf2d059109a108910781067105610457f24505610341023db3c251526000cc8cbffc9f90004d48ecb5b0ad3fff4043010ac109b108a107910681057104610351024db3cc87f01ca0055a050abce18f40006c8f40015f40013f40001c8f40012f40012f40013cb1f13cb3f13cb1f12cdcdc9ed54e02182107362d09dbae3022182104ef5cb26bae3022182108b341823ba171a1e2302703083072b0259f40f6fa192306ddf206e92306d8e87d0db3c6c1b6f0be2206ef2d058206ef2d0806f2bf82326b9f2d05003f2d05b7f03db3c251801dc561181010b2b59f40a6fa192306ddff8416f2443305230fa40fa0071d721fa00fa00306c6170f83a7101aa00a0802881753070f838a081753070f836aa008209312d00a0a0a170b60801206ef2d080708040531109111009108f2e518b108f107e106d05041112040311110341ff1900ee33c81bcb1f5009cf165007cf165005cf1613cbffcb1fcb3fca0012cb3f12cb07cbffc9c8ccc9d010465413050346666d103459c8556082100f8a7ea55008cb1f16cb3f5004fa0212ce01206e9430cf84809201cee2f40001fa02cec91340037fc8cf8580ca00cf8440ce01fa02806acf40f400c901fb0001965b0ad3fff4043010ac109b108a107910681057104610351024db3cc87f01ca0055a050abce18f40006c8f40015f40013f40001c8f40012f40012f40013cb1f13cb3f13cb1f12cdcdc9ed541b01983083072a0259f40f6fa192306ddf206e92306d8e1bd0d31ffa40fa40d3ffd31fd33fd200f404d33fd30755906c1a6f0ae2206ef2d058206ef2d0806f2af82326b9f2d05003f2d05b7f03db3c1c01d2561081010b2a59f40a6fa192306ddff8416f2443305230fa40fa0071d721fa00fa00306c6170f83a7101aa00a0802881753070f838a081753070f836aa008209312d00a0a0a170b60801206ef2d0807080405311108f2d108f517b107e106d05104b031111031110021d00e633c81acb1f5008cf165006cf1614cbff12cb1fcb3fca0012cb3f12cb07cbffc9c8ccc9d025105803461450886d103459c8556082100f8a7ea55008cb1f16cb3f5004fa0212ce01206e9430cf84809201cee2f40001fa02cec940037fc8cf8580ca00cf8440ce01fa02806acf40f400c901fb0001a25b0ad3ffd3ffd33ffa40f4043010df10ce10bd10ac109b108a107910681057db3cc87f01ca0055a050abce18f40006c8f40015f40013f40001c8f40012f40012f40013cb1f13cb3f13cb1f12cdcdc9ed541f03bc302d83072559f40f6fa192306ddf206e92306d8e87d0db3c6c1b6f0be2206eb3e302308307544d1559f40f6fa192306ddf206e92306d8e1bd0d31ffa40fa40d3ffd31fd33fd200f404d33fd30755906c1a6f0ae2206eb3e3025f04f2c05825202101c83403206ef2d0806f2b306c443434f2d05b21a1315220bc6c12f2d0672083072380404133f40e6fa19401d70130925b6de26c216eb3f2d0682581010b2259f40b6fa192306ddf206e92306d9fd0fa40d200d31fd30f55306c146f04e2206eb3915be30da42201c6206ef2d0806f2a306c443401f2d05b5112a1325222bc6c12f2d0672083072380404133f40e6fa19401d70130925b6de26c216eb3f2d0682581010b2259f40b6fa192306ddf206e92306d9fd0fa40d200d31fd30f55306c146f04e2206eb3915be30da42200a820206ef2d0806f245f0321206ef2d0806f2410235f0322206ef2d0806f24135f03a403206ef2d0806f246c314130431381010b5024c855305034ceca00cb1fcb0fc9103712206e953059f45930944133f413e20404d88ecd5b0ad3ffd3fff4043010bd10ac109b108a10791068105710461035db3cc87f01ca0055a050abce18f40006c8f40015f40013f40001c8f40012f40012f40013cb1f13cb3f13cb1f12cdcdc9ed54e0218210595f07bcbae3022182107362d09fbae302218210946a98b6ba242c2e3104ec302b83072359f40f6fa192306ddf206e92306d8e87d0db3c6c1b6f0be2206eb38f446c12206ef2d0806f2b2283072d80404133f40e6fa19401d70130925b6de2206ef2d05f21c000917f9321c002e28e89206ef2d080550bdb3c8e89206ef2d080550bdb3ce2e0308307544b1359f40f6fa192306ddf252628290044d31ffa40fa40fa40d401d0d3ffd31fd33fd200f404d33fd30730107b107a1079107801e6561381010b2d59f40a6fa192306ddff8416f2443305230fa40fa0071d721fa00fa00306c6170f83a7101aa00a0802881753070f838a081753070f836aa008209312d00a0a0a170b60801206ef2d080708040210a11110a09111009108f2e08107e106d105c041112040311110302111002500d2700e433c81bcb1f5009cf165007cf165005cf1613cbffcb1fcb3fca0012cb3f12cb07cbffc9c8ccc9d0241035596d103459c8556082100f8a7ea55008cb1f16cb3f5004fa0212ce01206e9430cf84809201cee2f40001fa02cec940037fc8cf8580ca00cf8440ce01fa02806acf40f400c901fb0000045f0d01ae206e92306d8e1bd0d31ffa40fa40d3ffd31fd33fd200f404d33fd30755906c1a6f0ae2206eb38eaa206ef2d0806f2a2283072c80404133f40e6fa19401d70130925b6de2206ef2d05f206ef2d080550adb3ce05bf2c0582a01da561281010b2c59f40a6fa192306ddff8416f2443305230fa40fa0071d721fa00fa00306c6170f83a7101aa00a0802881753070f838a081753070f836aa008209312d00a0a0a170b60801206ef2d0807080402109111009108f2e08107e106d105c104b0311110302111002500d2b00e433c81acb1f5008cf165006cf1614cbff12cb1fcb3fca0012cb3f12cb07cbffc9c8ccc9d025104546336d103459c8556082100f8a7ea55008cb1f16cb3f5004fa0212ce01206e9430cf84809201cee2f40001fa02cec9433040037fc8cf8580ca00cf8440ce01fa02806acf40f400c901fb00019a5b0ad31ffa40f4043010bd10ac109b108a10791068105710461035db3cc87f01ca0055a050abce18f40006c8f40015f40013f40001c8f40012f40012f40013cb1f13cb3f13cb1f12cdcdc9ed542d006830f84252d0c705b3f2d05652107f70431380205024c855305034cb1fceca00cb1fc9103612206e953059f45b30944133f417e203019a5b0afa40d200f4043010bd10ac109b108a10791068105710461035db3cc87f01ca0055a050abce18f40006c8f40015f40013f40001c8f40012f40012f40013cb1f13cb3f13cb1f12cdcdc9ed542f01ee302681010b2359f40b6fa192306ddf206e92306d9fd0fa40d200d31fd30f55306c146f04e2206ef2d06020206ef2d0806f24135f03a4029f20206ef2d0806f246c31a48064b6089e20206ef2d0806f246c31a570b609e221206ef2d0806f245f0302206ef2d0806f2410235f034033431381010b5024c830003c55305034ceca00cb1fcb0fc9103712206e953059f45930944133f413e20401fe8e765b0ad33f30c8018210aff90f5758cb1fcb3fc9109b108a107910681057104610354430f84270705003804201503304c8cf8580ca00cf8440ce01fa02806acf40f400c901fb00c87f01ca0055a050abce18f40006c8f40015f40013f40001c8f40012f40012f40013cb1f13cb3f13cb1f12cdcdc9ed54e03cc0000bc12132009c1bb08e44f842c8cf8508ce70cf0b6ec98042fb00108a5517c87f01ca0055a050abce18f40006c8f40015f40013f40001c8f40012f40012f40013cb1f13cb3f13cb1f12cdcdc9ed54e05f0bf2c08259ba89ee');
    const builder = beginCell();
    builder.storeUint(0, 1);
    initTonFusion_init_args({ $$type: 'TonFusion_init_args' })(builder);
    const __data = builder.endCell();
    return { code: __code, data: __data };
}

export const TonFusion_errors = {
    2: { message: "Stack underflow" },
    3: { message: "Stack overflow" },
    4: { message: "Integer overflow" },
    5: { message: "Integer out of expected range" },
    6: { message: "Invalid opcode" },
    7: { message: "Type check error" },
    8: { message: "Cell overflow" },
    9: { message: "Cell underflow" },
    10: { message: "Dictionary error" },
    11: { message: "'Unknown' error" },
    12: { message: "Fatal error" },
    13: { message: "Out of gas error" },
    14: { message: "Virtualization error" },
    32: { message: "Action list is invalid" },
    33: { message: "Action list is too long" },
    34: { message: "Action is invalid or not supported" },
    35: { message: "Invalid source address in outbound message" },
    36: { message: "Invalid destination address in outbound message" },
    37: { message: "Not enough Toncoin" },
    38: { message: "Not enough extra currencies" },
    39: { message: "Outbound message does not fit into a cell after rewriting" },
    40: { message: "Cannot process a message" },
    41: { message: "Library reference is null" },
    42: { message: "Library change action error" },
    43: { message: "Exceeded maximum number of cells in the library or the maximum depth of the Merkle tree" },
    50: { message: "Account state size exceeded limits" },
    128: { message: "Null reference exception" },
    129: { message: "Invalid serialization prefix" },
    130: { message: "Invalid incoming message" },
    131: { message: "Constraints error" },
    132: { message: "Access denied" },
    133: { message: "Contract stopped" },
    134: { message: "Invalid argument" },
    135: { message: "Code of a contract was not found" },
    136: { message: "Invalid standard address" },
    138: { message: "Not a basechain address" },
} as const

export const TonFusion_errors_backward = {
    "Stack underflow": 2,
    "Stack overflow": 3,
    "Integer overflow": 4,
    "Integer out of expected range": 5,
    "Invalid opcode": 6,
    "Type check error": 7,
    "Cell overflow": 8,
    "Cell underflow": 9,
    "Dictionary error": 10,
    "'Unknown' error": 11,
    "Fatal error": 12,
    "Out of gas error": 13,
    "Virtualization error": 14,
    "Action list is invalid": 32,
    "Action list is too long": 33,
    "Action is invalid or not supported": 34,
    "Invalid source address in outbound message": 35,
    "Invalid destination address in outbound message": 36,
    "Not enough Toncoin": 37,
    "Not enough extra currencies": 38,
    "Outbound message does not fit into a cell after rewriting": 39,
    "Cannot process a message": 40,
    "Library reference is null": 41,
    "Library change action error": 42,
    "Exceeded maximum number of cells in the library or the maximum depth of the Merkle tree": 43,
    "Account state size exceeded limits": 50,
    "Null reference exception": 128,
    "Invalid serialization prefix": 129,
    "Invalid incoming message": 130,
    "Constraints error": 131,
    "Access denied": 132,
    "Contract stopped": 133,
    "Invalid argument": 134,
    "Code of a contract was not found": 135,
    "Invalid standard address": 136,
    "Not a basechain address": 138,
} as const

const TonFusion_types: ABIType[] = [
    {"name":"DataSize","header":null,"fields":[{"name":"cells","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"bits","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"refs","type":{"kind":"simple","type":"int","optional":false,"format":257}}]},
    {"name":"SignedBundle","header":null,"fields":[{"name":"signature","type":{"kind":"simple","type":"fixed-bytes","optional":false,"format":64}},{"name":"signedData","type":{"kind":"simple","type":"slice","optional":false,"format":"remainder"}}]},
    {"name":"StateInit","header":null,"fields":[{"name":"code","type":{"kind":"simple","type":"cell","optional":false}},{"name":"data","type":{"kind":"simple","type":"cell","optional":false}}]},
    {"name":"Context","header":null,"fields":[{"name":"bounceable","type":{"kind":"simple","type":"bool","optional":false}},{"name":"sender","type":{"kind":"simple","type":"address","optional":false}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"raw","type":{"kind":"simple","type":"slice","optional":false}}]},
    {"name":"SendParameters","header":null,"fields":[{"name":"mode","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"body","type":{"kind":"simple","type":"cell","optional":true}},{"name":"code","type":{"kind":"simple","type":"cell","optional":true}},{"name":"data","type":{"kind":"simple","type":"cell","optional":true}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"to","type":{"kind":"simple","type":"address","optional":false}},{"name":"bounce","type":{"kind":"simple","type":"bool","optional":false}}]},
    {"name":"MessageParameters","header":null,"fields":[{"name":"mode","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"body","type":{"kind":"simple","type":"cell","optional":true}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"to","type":{"kind":"simple","type":"address","optional":false}},{"name":"bounce","type":{"kind":"simple","type":"bool","optional":false}}]},
    {"name":"DeployParameters","header":null,"fields":[{"name":"mode","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"body","type":{"kind":"simple","type":"cell","optional":true}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"bounce","type":{"kind":"simple","type":"bool","optional":false}},{"name":"init","type":{"kind":"simple","type":"StateInit","optional":false}}]},
    {"name":"StdAddress","header":null,"fields":[{"name":"workchain","type":{"kind":"simple","type":"int","optional":false,"format":8}},{"name":"address","type":{"kind":"simple","type":"uint","optional":false,"format":256}}]},
    {"name":"VarAddress","header":null,"fields":[{"name":"workchain","type":{"kind":"simple","type":"int","optional":false,"format":32}},{"name":"address","type":{"kind":"simple","type":"slice","optional":false}}]},
    {"name":"BasechainAddress","header":null,"fields":[{"name":"hash","type":{"kind":"simple","type":"int","optional":true,"format":257}}]},
    {"name":"Deploy","header":2490013878,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}}]},
    {"name":"DeployOk","header":2952335191,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}}]},
    {"name":"FactoryDeploy","header":1829761339,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"cashback","type":{"kind":"simple","type":"address","optional":false}}]},
    {"name":"LockJetton","header":4111661023,"fields":[{"name":"orderConfig","type":{"kind":"simple","type":"OrderConfig","optional":false}},{"name":"jetton","type":{"kind":"simple","type":"cell","optional":false}},{"name":"customPayload","type":{"kind":"simple","type":"cell","optional":true}}]},
    {"name":"CreateOrder","header":1935855772,"fields":[{"name":"orderConfig","type":{"kind":"simple","type":"Order","optional":false}},{"name":"jetton","type":{"kind":"simple","type":"cell","optional":false}},{"name":"customPayload","type":{"kind":"simple","type":"cell","optional":true}}]},
    {"name":"CreateEVMToTONOrder","header":2335447074,"fields":[{"name":"orderConfig","type":{"kind":"simple","type":"OrderConfig","optional":false}},{"name":"evmContractAddress","type":{"kind":"simple","type":"address","optional":false}},{"name":"customPayload","type":{"kind":"simple","type":"cell","optional":true}}]},
    {"name":"CreateTONToEVMOrder","header":1646500216,"fields":[{"name":"orderConfig","type":{"kind":"simple","type":"OrderConfig","optional":false}},{"name":"targetChainId","type":{"kind":"simple","type":"uint","optional":false,"format":32}},{"name":"customPayload","type":{"kind":"simple","type":"cell","optional":true}}]},
    {"name":"PartialFill","header":1324731174,"fields":[{"name":"orderHash","type":{"kind":"simple","type":"uint","optional":false,"format":256}},{"name":"secret","type":{"kind":"simple","type":"uint","optional":false,"format":256}},{"name":"fillAmount","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"resolver","type":{"kind":"simple","type":"address","optional":false}},{"name":"customPayload","type":{"kind":"simple","type":"cell","optional":true}}]},
    {"name":"CompletePartialFill","header":2335447075,"fields":[{"name":"orderHash","type":{"kind":"simple","type":"uint","optional":false,"format":256}},{"name":"secret","type":{"kind":"simple","type":"uint","optional":false,"format":256}},{"name":"customPayload","type":{"kind":"simple","type":"cell","optional":true}}]},
    {"name":"DeployEscrow","header":1499400124,"fields":[{"name":"chainId","type":{"kind":"simple","type":"uint","optional":false,"format":32}},{"name":"targetAddress","type":{"kind":"simple","type":"address","optional":false}},{"name":"customPayload","type":{"kind":"simple","type":"cell","optional":true}}]},
    {"name":"EscrowDeployed","header":2078119902,"fields":[{"name":"chainId","type":{"kind":"simple","type":"uint","optional":false,"format":32}},{"name":"contractAddress","type":{"kind":"simple","type":"address","optional":false}},{"name":"success","type":{"kind":"simple","type":"bool","optional":false}},{"name":"customPayload","type":{"kind":"simple","type":"cell","optional":true}}]},
    {"name":"RegisterRelayer","header":1935855774,"fields":[{"name":"relayer","type":{"kind":"simple","type":"address","optional":false}},{"name":"customPayload","type":{"kind":"simple","type":"cell","optional":true}}]},
    {"name":"UpdateRelayerStats","header":1935855775,"fields":[{"name":"relayer","type":{"kind":"simple","type":"address","optional":false}},{"name":"success","type":{"kind":"simple","type":"bool","optional":false}},{"name":"customPayload","type":{"kind":"simple","type":"cell","optional":true}}]},
    {"name":"GetFund","header":1348689874,"fields":[{"name":"secret","type":{"kind":"simple","type":"uint","optional":false,"format":256}},{"name":"hash","type":{"kind":"simple","type":"uint","optional":false,"format":256}},{"name":"customPayload","type":{"kind":"simple","type":"cell","optional":true}}]},
    {"name":"Refund","header":3835567563,"fields":[{"name":"hash","type":{"kind":"simple","type":"uint","optional":false,"format":256}},{"name":"customPayload","type":{"kind":"simple","type":"cell","optional":true}}]},
    {"name":"RefundOrder","header":1935855773,"fields":[{"name":"hash","type":{"kind":"simple","type":"uint","optional":false,"format":256}},{"name":"customPayload","type":{"kind":"simple","type":"cell","optional":true}}]},
    {"name":"SetWhiteList","header":2844130808,"fields":[{"name":"resolver","type":{"kind":"simple","type":"address","optional":false}},{"name":"whitelistStatus","type":{"kind":"simple","type":"bool","optional":false}}]},
    {"name":"JettonNotifyWithActionRequest","header":1935855772,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"amount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"sender","type":{"kind":"simple","type":"address","optional":false}},{"name":"actionOpcode","type":{"kind":"simple","type":"uint","optional":false,"format":32}},{"name":"actionPayload","type":{"kind":"simple","type":"cell","optional":false}}]},
    {"name":"GetWalletAddress","header":801842850,"fields":[{"name":"queryId","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"owner","type":{"kind":"simple","type":"address","optional":false}}]},
    {"name":"CalculateOutput","header":null,"fields":[{"name":"protocolFeeAmount","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"integratorFeeAmount","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"outputAmount","type":{"kind":"simple","type":"uint","optional":false,"format":64}}]},
    {"name":"PointAndTimeDelta","header":null,"fields":[{"name":"rateBump","type":{"kind":"simple","type":"uint","optional":false,"format":16}},{"name":"timeDelta","type":{"kind":"simple","type":"uint","optional":false,"format":16}}]},
    {"name":"OrderConfig","header":null,"fields":[{"name":"id","type":{"kind":"simple","type":"uint","optional":false,"format":32}},{"name":"srcJettonAddress","type":{"kind":"simple","type":"address","optional":false}},{"name":"senderPubKey","type":{"kind":"simple","type":"address","optional":false}},{"name":"receiverPubKey","type":{"kind":"simple","type":"address","optional":false}},{"name":"hashlock","type":{"kind":"simple","type":"uint","optional":false,"format":256}},{"name":"timelock","type":{"kind":"simple","type":"uint","optional":false,"format":32}},{"name":"amount","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"finalized","type":{"kind":"simple","type":"bool","optional":false}},{"name":"partialFills","type":{"kind":"dict","key":"uint","keyFormat":256,"value":"uint","valueFormat":64}},{"name":"totalFilled","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"direction","type":{"kind":"simple","type":"uint","optional":false,"format":8}}]},
    {"name":"Order","header":null,"fields":[{"name":"id","type":{"kind":"simple","type":"uint","optional":false,"format":32}},{"name":"srcJettonAddress","type":{"kind":"simple","type":"address","optional":false}},{"name":"senderPubKey","type":{"kind":"simple","type":"address","optional":false}},{"name":"hashlock","type":{"kind":"simple","type":"uint","optional":false,"format":256}},{"name":"timelock","type":{"kind":"simple","type":"uint","optional":false,"format":32}},{"name":"amount","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"finalized","type":{"kind":"simple","type":"bool","optional":false}},{"name":"partialFills","type":{"kind":"dict","key":"uint","keyFormat":256,"value":"uint","valueFormat":64}},{"name":"totalFilled","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"direction","type":{"kind":"simple","type":"uint","optional":false,"format":8}}]},
    {"name":"EscrowContract","header":null,"fields":[{"name":"chainId","type":{"kind":"simple","type":"uint","optional":false,"format":32}},{"name":"contractAddress","type":{"kind":"simple","type":"address","optional":false}},{"name":"deployed","type":{"kind":"simple","type":"bool","optional":false}},{"name":"totalOrders","type":{"kind":"simple","type":"uint","optional":false,"format":32}}]},
    {"name":"RelayerData","header":null,"fields":[{"name":"address","type":{"kind":"simple","type":"address","optional":false}},{"name":"whitelisted","type":{"kind":"simple","type":"bool","optional":false}},{"name":"totalResolves","type":{"kind":"simple","type":"uint","optional":false,"format":32}},{"name":"successRate","type":{"kind":"simple","type":"uint","optional":false,"format":16}}]},
    {"name":"JettonWalletData","header":null,"fields":[{"name":"balance","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"ownerAddress","type":{"kind":"simple","type":"address","optional":false}},{"name":"jettonMasterAddress","type":{"kind":"simple","type":"address","optional":false}},{"name":"jettonWalletCode","type":{"kind":"simple","type":"cell","optional":false}}]},
    {"name":"SendViaJettonTransfer","header":260734629,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"amount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"destination","type":{"kind":"simple","type":"address","optional":false}},{"name":"responseDestination","type":{"kind":"simple","type":"address","optional":true}},{"name":"customPayload","type":{"kind":"simple","type":"cell","optional":true}},{"name":"forwardTonAmount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"forwardPayload","type":{"kind":"simple","type":"slice","optional":false,"format":"remainder"}}]},
    {"name":"TonFusion$Data","header":null,"fields":[{"name":"owner","type":{"kind":"simple","type":"address","optional":false}},{"name":"escrowLock","type":{"kind":"dict","key":"uint","keyFormat":256,"value":"OrderConfig","valueFormat":"ref"}},{"name":"escrowOrder","type":{"kind":"dict","key":"uint","keyFormat":256,"value":"Order","valueFormat":"ref"}},{"name":"jettons","type":{"kind":"dict","key":"address","value":"cell","valueFormat":"ref"}},{"name":"jettonAccount","type":{"kind":"dict","key":"address","value":"address"}},{"name":"whiteLists","type":{"kind":"dict","key":"address","value":"bool"}},{"name":"relayers","type":{"kind":"dict","key":"address","value":"RelayerData","valueFormat":"ref"}},{"name":"escrowContracts","type":{"kind":"dict","key":"uint","keyFormat":32,"value":"EscrowContract","valueFormat":"ref"}},{"name":"totalOrders","type":{"kind":"simple","type":"uint","optional":false,"format":32}},{"name":"totalVolume","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"totalResolves","type":{"kind":"simple","type":"uint","optional":false,"format":32}}]},
]

const TonFusion_opcodes = {
    "Deploy": 2490013878,
    "DeployOk": 2952335191,
    "FactoryDeploy": 1829761339,
    "LockJetton": 4111661023,
    "CreateOrder": 1935855772,
    "CreateEVMToTONOrder": 2335447074,
    "CreateTONToEVMOrder": 1646500216,
    "PartialFill": 1324731174,
    "CompletePartialFill": 2335447075,
    "DeployEscrow": 1499400124,
    "EscrowDeployed": 2078119902,
    "RegisterRelayer": 1935855774,
    "UpdateRelayerStats": 1935855775,
    "GetFund": 1348689874,
    "Refund": 3835567563,
    "RefundOrder": 1935855773,
    "SetWhiteList": 2844130808,
    "JettonNotifyWithActionRequest": 1935855772,
    "GetWalletAddress": 801842850,
    "SendViaJettonTransfer": 260734629,
}

const TonFusion_getters: ABIGetter[] = [
]

export const TonFusion_getterMapping: { [key: string]: string } = {
}

const TonFusion_receivers: ABIReceiver[] = [
    {"receiver":"internal","message":{"kind":"empty"}},
    {"receiver":"internal","message":{"kind":"typed","type":"SetWhiteList"}},
    {"receiver":"internal","message":{"kind":"typed","type":"RegisterRelayer"}},
    {"receiver":"internal","message":{"kind":"typed","type":"JettonNotifyWithActionRequest"}},
    {"receiver":"internal","message":{"kind":"typed","type":"GetFund"}},
    {"receiver":"internal","message":{"kind":"typed","type":"Refund"}},
    {"receiver":"internal","message":{"kind":"typed","type":"RefundOrder"}},
    {"receiver":"internal","message":{"kind":"typed","type":"PartialFill"}},
    {"receiver":"internal","message":{"kind":"typed","type":"CompletePartialFill"}},
    {"receiver":"internal","message":{"kind":"typed","type":"DeployEscrow"}},
    {"receiver":"internal","message":{"kind":"typed","type":"UpdateRelayerStats"}},
    {"receiver":"internal","message":{"kind":"typed","type":"Deploy"}},
]

export const INCONSISTENT_NATIVE_SRC_TRAIT = 70n;
export const INCONSISTENT_NATIVE_DST_TRAIT = 71n;
export const INVALID_AMOUNT = 72n;
export const MISSING_MAKER_DST_ATA = 73n;
export const NOT_ENOUGH_TOKENS_IN_ESCROW = 74n;
export const ORDER_EXPIRED = 75n;
export const INVALID_ESTIMATED_TAKING_AMOUNT = 76n;
export const INVALID_PROTOCOL_SURPLUS_FEE = 77n;
export const INCONSISTENT_PROTOCOL_FEE_CONFIG = 78n;
export const INCONSISTENT_INTEGRATOR_FEE_CONFIG = 79n;
export const ORDER_NOT_EXPIRED = 80n;
export const INVALID_CANCELLATION_FEE = 81n;
export const CANCEL_ORDER_BY_RESOLVER_IS_FORBIDDEN = 82n;
export const MISSING_TAKER_DST_ATA = 83n;
export const MISSING_MAKER_SRC_ATA = 84n;
export const INVALID_RECIPIENT = 85n;
export const INVALID_OWNER = 86n;
export const INVALID_WHITELIST = 87n;
export const INVALID_HASH = 88n;
export const INVALID_SECRET = 89n;
export const ORDER_ALREADY_EXISTS = 90n;
export const ORDER_ALREADY_FINALIZED = 91n;
export const INVALID_SWAP_DIRECTION = 92n;
export const INVALID_CHAIN_ID = 93n;
export const INVALID_PARTIAL_FILL = 94n;
export const ORDER_NOT_PARTIALLY_FILLED = 95n;
export const INVALID_RELAYER = 96n;
export const ESCROW_DEPLOYMENT_FAILED = 97n;
export const INVALID_ESCROW_CONTRACT = 98n;
export const INSUFFICIENT_FUNDS = 99n;
export const RELAYER_NOT_WHITELISTED = 100n;
export const ORDER_ALREADY_COMPLETED = 101n;
export const INVALID_TARGET_CHAIN = 102n;
export const PARTIAL_FILL_EXCEEDS_ORDER = 103n;
export const SECRET_ALREADY_USED = 104n;
export const WRONG_OP = 65535n;
export const JettonTransferGas = 50000000n;
export const TON_TO_EVM = 0n;
export const EVM_TO_TON = 1n;
export const TON_TO_TON = 2n;
export const HTLC_PENDING = 0n;
export const HTLC_COMPLETED = 1n;
export const HTLC_EXPIRED = 2n;
export const HTLC_REFUNDED = 3n;
export const BASE_1E2 = 100n;
export const BASE_1E3 = 1000n;
export const BASE_1E5 = 100000n;

export class TonFusion implements Contract {
    
    public static readonly storageReserve = 0n;
    public static readonly errors = TonFusion_errors_backward;
    public static readonly opcodes = TonFusion_opcodes;
    
    static async init() {
        return await TonFusion_init();
    }
    
    static async fromInit() {
        const __gen_init = await TonFusion_init();
        const address = contractAddress(0, __gen_init);
        return new TonFusion(address, __gen_init);
    }
    
    static fromAddress(address: Address) {
        return new TonFusion(address);
    }
    
    readonly address: Address; 
    readonly init?: { code: Cell, data: Cell };
    readonly abi: ContractABI = {
        types:  TonFusion_types,
        getters: TonFusion_getters,
        receivers: TonFusion_receivers,
        errors: TonFusion_errors,
    };
    
    constructor(address: Address, init?: { code: Cell, data: Cell }) {
        this.address = address;
        this.init = init;
    }
    
    async send(provider: ContractProvider, via: Sender, args: { value: bigint, bounce?: boolean| null | undefined }, message: null | SetWhiteList | RegisterRelayer | JettonNotifyWithActionRequest | GetFund | Refund | RefundOrder | PartialFill | CompletePartialFill | DeployEscrow | UpdateRelayerStats | Deploy) {
        
        let body: Cell | null = null;
        if (message === null) {
            body = new Cell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'SetWhiteList') {
            body = beginCell().store(storeSetWhiteList(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'RegisterRelayer') {
            body = beginCell().store(storeRegisterRelayer(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'JettonNotifyWithActionRequest') {
            body = beginCell().store(storeJettonNotifyWithActionRequest(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'GetFund') {
            body = beginCell().store(storeGetFund(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'Refund') {
            body = beginCell().store(storeRefund(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'RefundOrder') {
            body = beginCell().store(storeRefundOrder(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'PartialFill') {
            body = beginCell().store(storePartialFill(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'CompletePartialFill') {
            body = beginCell().store(storeCompletePartialFill(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'DeployEscrow') {
            body = beginCell().store(storeDeployEscrow(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'UpdateRelayerStats') {
            body = beginCell().store(storeUpdateRelayerStats(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'Deploy') {
            body = beginCell().store(storeDeploy(message)).endCell();
        }
        if (body === null) { throw new Error('Invalid message type'); }
        
        await provider.internal(via, { ...args, body: body });
        
    }
    
}