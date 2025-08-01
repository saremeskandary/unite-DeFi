import "@stdlib/deploy";

import "./messages.tact";
import "./errors.tact";
import "./states.tact";
import "./consts.tact";
import "./utils.tact";





contract TonFusion with Deployable {

    
    owner: Address;
    escrowLock: map<Int as uint256, OrderConfig>=emptyMap();
    jettons: map<Address, Cell>=emptyMap();
    jettonAccount: map<Address, Address>=emptyMap();
    whiteLists: map<Address, Bool>=emptyMap();


    init() {
        self.owner=sender();

    }

    receive() { cashback(sender()) }

    receive(action: SetWhiteList){
        if (self.owner!=sender()) {
            throw(INVALID_OWNER);
        }
        self.whiteLists.set(action.resolver,action.whitelistStatus);
    }

    receive(action: JettonNotifyWithActionRequest){
        if (action.actionOpcode==LockJetton.opcode()) {
            let msg=LockJetton.fromCell(action.actionPayload);

            let wallet: Address=calculateJettonWalletAddress(action.sender,msg.orderConfig.srcJettonAddress,msg.jetton);
            if (wallet==sender()) {
                self.create(action.actionPayload);
                
            }
            else{
                cashback(sender());
                throw(INVALID_OWNER);
            }
        }
        
        
    }
    receive(action: GetFund){
        self.getFund(action)

    }
    receive(action: Refund){
        self.refund(action)

    }
        
    fun create( payload: Cell )  {

        
        let msg=LockJetton.fromCell(payload);

        if (self.whiteLists.get(sender()) == true) {
            throw(INVALID_WHITELIST);
        }

        
        if (now() >= msg.orderConfig.timelock) {
            throw(ORDER_EXPIRED);
        }


        self.jettons.set(msg.orderConfig.srcJettonAddress,msg.jetton);
        self.jettonAccount.set(msg.orderConfig.srcJettonAddress,sender());
        self.escrowLock.set(msg.orderConfig.hashlock, msg.orderConfig);

    }
    
    
    fun getFund( msg: GetFund )  {
        
        let data=self.escrowLock.get(msg.hash);
        if (data) ==null{
            throw(INVALID_HASH);
            
        }
        let order=data!!;
        let secretHash=keccakBytes32(msg.secret);
        
        if (now() > order.timelock) {
            throw(ORDER_EXPIRED);
            
        }
        if (order.finalized) {
            throw(ORDER_EXPIRED);
            
        }
        if (secretHash != order.hashlock) {
            throw(INVALID_SECRET);
            
        }
        let jettonWallet=self.jettonAccount.get(order.srcJettonAddress);
        let ctx = context();
        // We estimate price of jetton transfer with 1 nanoton of in notify, so our estimation is more robust
        let remainingValue = ctx.value - priceOfJettonForward(ctx.readForwardFee(), 1);
        // If it is negative, it is better not to send any notify
        order.finalized=true;
        remainingValue = min(remainingValue, 0);
        message(MessageParameters {
            to: jettonWallet!!,
            value: 0,
            mode: SendRemainingValue,
            body: SendViaJettonTransfer {
                queryId: 0,
                amount: order.amount,
                responseDestination: order.receiverPubKey,
                destination: order.receiverPubKey,
                forwardTonAmount: remainingValue,
                forwardPayload: beginCell().storeRef(serializeOrderConfig(order,secretHash)).endCell().beginParse(),
                customPayload: null,
            }.toCell(),
        });

    }
    
    fun refund( msg: Refund )  {
        
        let data=self.escrowLock.get(msg.hash);
        if (data) ==null{
            throw(INVALID_HASH);
            
        }
        let order=data!!;
        
        
        if (now() < order.timelock) {
            throw(ORDER_NOT_EXPIRED);
            
        }
        if (order.finalized) {
            throw(ORDER_NOT_EXPIRED);
            
        }

        let jettonWallet=self.jettonAccount.get(order.srcJettonAddress);
        let ctx = context();
        // We estimate price of jetton transfer with 1 nanoton of in notify, so our estimation is more robust
        let remainingValue = ctx.value - priceOfJettonForward(ctx.readForwardFee(), 1);
        // If it is negative, it is better not to send any notify
        order.finalized=false;
        remainingValue = min(remainingValue, 0);
        message(MessageParameters {
            to: jettonWallet!!,
            value: 0,
            mode: SendRemainingValue,
            body: SendViaJettonTransfer {
                queryId: 0,
                amount: order.amount,
                responseDestination: order.senderPubKey,
                destination: order.senderPubKey,
                forwardTonAmount: remainingValue,
                forwardPayload: beginCell().storeRef(serializeOrderConfig(order,0)).endCell().beginParse(),
                customPayload: null,
            }.toCell(),
        });
    }
        


}

