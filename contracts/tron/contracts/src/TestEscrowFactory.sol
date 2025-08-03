pragma solidity 0.8.23;

import 'cross-chain-swap/EscrowFactory.sol';
import {IERC20} from 'openzeppelin-contracts/contracts/token/ERC20/IERC20.sol';

contract TestEscrowFactory is EscrowFactory {
    constructor(
        address limitOrderProtocol,
        IERC20 accessToken,
        address owner,
        uint32 rescueDelaySrc,
        uint32 rescueDelayDst
    ) EscrowFactory(limitOrderProtocol, accessToken, owner, rescueDelaySrc, rescueDelayDst) {}
}
