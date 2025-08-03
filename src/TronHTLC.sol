// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "./interfaces/IHTLCTron.sol";
import "./libraries/SafeMathTRX.sol";
import "./libraries/ReentrancyGuard.sol";

contract TronHTLC is IHTLCTron {
    using SafeMathTRX for uint256;
    using ReentrancyGuard for ReentrancyGuard.GuardData;

    // State variables
    mapping(bytes32 => HTLC) public htlcs;
    mapping(address => bytes32[]) public senderHTLCs;
    mapping(address => bytes32[]) public recipientHTLCs;

    ReentrancyGuard.GuardData private _guardData;

    // Modifiers
    modifier nonReentrant() {
        _guardData._enter();
        _;
        _guardData._exit();
    }

    modifier htlcExists(bytes32 _htlcId) {
        require(htlcs[_htlcId].sender != address(0), "HTLC does not exist");
        _;
    }

    modifier onlySender(bytes32 _htlcId) {
        require(
            htlcs[_htlcId].sender == msg.sender,
            "Only sender can call this"
        );
        _;
    }

    modifier onlyRecipient(bytes32 _htlcId) {
        require(
            htlcs[_htlcId].recipient == msg.sender,
            "Only recipient can call this"
        );
        _;
    }

    modifier htlcActive(bytes32 _htlcId) {
        require(htlcs[_htlcId].isActive, "HTLC is not active");
        _;
    }

    modifier notExpired(bytes32 _htlcId) {
        require(!isExpired(_htlcId), "HTLC has expired");
        _;
    }

    modifier hasExpired(bytes32 _htlcId) {
        require(isExpired(_htlcId), "HTLC has not expired yet");
        _;
    }

    /**
     * @dev Creates a new HTLC with hashlock and timelock
     * @param _recipient Address that can redeem the HTLC
     * @param _hashlock SHA256 hash of the secret
     * @param _timelock Duration in seconds until HTLC expires
     * @return htlcId Unique identifier for the created HTLC
     */
    function createHTLC(
        address _recipient,
        bytes32 _hashlock,
        uint256 _timelock
    ) external payable override returns (bytes32 htlcId) {
        require(_recipient != address(0), "Invalid recipient address");
        require(
            _recipient != msg.sender,
            "Sender and recipient cannot be the same"
        );
        require(_hashlock != bytes32(0), "Invalid hashlock");
        require(_timelock > 0, "Timelock must be greater than 0");
        require(msg.value > 0, "Amount must be greater than 0");

        // Generate unique HTLC ID
        htlcId = keccak256(
            abi.encodePacked(
                msg.sender,
                _recipient,
                msg.value,
                _hashlock,
                _timelock,
                block.timestamp,
                block.number
            )
        );

        require(htlcs[htlcId].sender == address(0), "HTLC already exists");

        // Create HTLC
        htlcs[htlcId] = HTLC({
            sender: msg.sender,
            recipient: _recipient,
            amount: msg.value,
            hashlock: _hashlock,
            timelock: _timelock,
            startTime: block.timestamp,
            isActive: true,
            isRedeemed: false,
            isRefunded: false,
            secret: ""
        });

        // Track HTLCs by sender and recipient
        senderHTLCs[msg.sender].push(htlcId);
        recipientHTLCs[_recipient].push(htlcId);

        emit HTLCCreated(
            htlcId,
            msg.sender,
            _recipient,
            msg.value,
            _hashlock,
            _timelock
        );

        return htlcId;
    }

    /**
     * @dev Redeems an HTLC by providing the correct secret
     * @param _htlcId Unique identifier of the HTLC
     * @param _secret Secret that hashes to the stored hashlock
     */
    function redeemHTLC(
        bytes32 _htlcId,
        string calldata _secret
    )
        external
        override
        htlcExists(_htlcId)
        onlyRecipient(_htlcId)
        htlcActive(_htlcId)
        notExpired(_htlcId)
        nonReentrant
    {
        require(validateSecret(_htlcId, _secret), "Invalid secret");

        HTLC storage htlc = htlcs[_htlcId];

        // Update HTLC state
        htlc.isActive = false;
        htlc.isRedeemed = true;
        htlc.secret = _secret;

        // Transfer funds to recipient
        uint256 amount = htlc.amount;
        (bool success, ) = payable(htlc.recipient).call{value: amount}("");
        require(success, "Transfer failed");

        emit HTLCRedeemed(_htlcId, htlc.recipient, _secret);
    }

    /**
     * @dev Refunds an HTLC after it has expired
     * @param _htlcId Unique identifier of the HTLC
     */
    function refundHTLC(
        bytes32 _htlcId
    )
        external
        override
        htlcExists(_htlcId)
        onlySender(_htlcId)
        htlcActive(_htlcId)
        hasExpired(_htlcId)
        nonReentrant
    {
        HTLC storage htlc = htlcs[_htlcId];

        // Update HTLC state
        htlc.isActive = false;
        htlc.isRefunded = true;

        // Transfer funds back to sender
        uint256 amount = htlc.amount;
        (bool success, ) = payable(htlc.sender).call{value: amount}("");
        require(success, "Refund failed");

        emit HTLCRefunded(_htlcId, htlc.sender);
    }

    /**
     * @dev Gets HTLC details
     * @param _htlcId Unique identifier of the HTLC
     * @return HTLC struct containing all details
     */
    function getHTLC(
        bytes32 _htlcId
    ) external view override returns (HTLC memory) {
        return htlcs[_htlcId];
    }

    /**
     * @dev Validates if the provided secret matches the hashlock
     * @param _htlcId Unique identifier of the HTLC
     * @param _secret Secret to validate
     * @return bool True if secret is valid
     */
    function validateSecret(
        bytes32 _htlcId,
        string calldata _secret
    ) public view override returns (bool) {
        bytes32 hash = sha256(abi.encodePacked(_secret));
        return hash == htlcs[_htlcId].hashlock;
    }

    /**
     * @dev Checks if an HTLC has expired
     * @param _htlcId Unique identifier of the HTLC
     * @return bool True if HTLC has expired
     */
    function isExpired(bytes32 _htlcId) public view override returns (bool) {
        HTLC memory htlc = htlcs[_htlcId];
        return block.timestamp >= htlc.startTime.add(htlc.timelock);
    }

    /**
     * @dev Gets remaining time until HTLC expires
     * @param _htlcId Unique identifier of the HTLC
     * @return uint256 Remaining time in seconds (0 if expired)
     */
    function getTimeRemaining(
        bytes32 _htlcId
    ) external view override returns (uint256) {
        HTLC memory htlc = htlcs[_htlcId];
        uint256 expiryTime = htlc.startTime.add(htlc.timelock);

        if (block.timestamp >= expiryTime) {
            return 0;
        }

        return expiryTime.sub(block.timestamp);
    }

    /**
     * @dev Generates a SHA256 hashlock from a secret
     * @param _secret Secret string to hash
     * @return bytes32 SHA256 hash of the secret
     */
    function generateHashlock(
        string calldata _secret
    ) external pure override returns (bytes32) {
        return sha256(abi.encodePacked(_secret));
    }

    /**
     * @dev Gets all HTLC IDs for a sender
     * @param _sender Address to query
     * @return bytes32[] Array of HTLC IDs
     */
    function getSenderHTLCs(
        address _sender
    ) external view override returns (bytes32[] memory) {
        return senderHTLCs[_sender];
    }

    /**
     * @dev Gets all HTLC IDs for a recipient
     * @param _recipient Address to query
     * @return bytes32[] Array of HTLC IDs
     */
    function getRecipientHTLCs(
        address _recipient
    ) external view override returns (bytes32[] memory) {
        return recipientHTLCs[_recipient];
    }
}
