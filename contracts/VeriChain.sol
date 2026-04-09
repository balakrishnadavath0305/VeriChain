// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract VeriChain {
    struct Certificate {
        address owner;
        bytes32 fileHash;
        string ipfsCid;
        uint256 timestamp;
        string title;
        string mime;
    }

    mapping(bytes32 => Certificate) private certificates;

    event Certified(
        address indexed owner,
        bytes32 indexed fileHash,
        string ipfsCid,
        uint256 timestamp,
        string title,
        string mime
    );

    error AlreadyCertified();
    error NotFound();

    function certify(
        bytes32 fileHash,
        string memory ipfsCid,
        string memory title,
        string memory mime
    ) external {
        if (certificates[fileHash].owner != address(0)) revert AlreadyCertified();
        certificates[fileHash] = Certificate({
            owner: msg.sender,
            fileHash: fileHash,
            ipfsCid: ipfsCid,
            timestamp: block.timestamp,
            title: title,
            mime: mime
        });
        emit Certified(msg.sender, fileHash, ipfsCid, block.timestamp, title, mime);
    }

    function getCertificate(bytes32 fileHash) external view returns (Certificate memory cert) {
        cert = certificates[fileHash];
        if (cert.owner == address(0)) revert NotFound();
    }

    function isCertified(bytes32 fileHash) external view returns (bool) {
        return certificates[fileHash].owner != address(0);
    }
}
