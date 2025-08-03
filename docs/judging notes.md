from [you tube explanaion]([https://](https://www.youtube.com/live/EnHov0tCalU))


- swap must be bi-directional.
- manage the htlc and communication between an EVM chang and you non-evm chain (all CL/testne is ok!)
-- properly handle hashlock logic
-- properly handle contract exiration/reverts

should use 1inch scrow factory the deploy 1inch escrow contracts 
should deploy scraw contract in target chain

improving score:
- ui
-enable pratial fill; you can doo more with the secret of scrow contract,, you can actually do multiple secret so it can be parital fills for multiple resolver.
- relayer and resolver in non-evm chanin. and trying to imitate our design so is that looks more cohesive and work more fluently
- anable on mainnet or one of the L2s Base/Arbitrum/etc


important note:
- Do Not post any orders to our REST APIs. this is for our live resolvers
-- your resolvers will not work with our official backend system
work with just smartcontract level and filling things on your own without acutally being broadcast to every body and being live to the system
