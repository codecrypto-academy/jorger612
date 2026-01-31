// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract DialogueHistory {
    
    struct DialogueEntry {
        address sender;
        address receiver;
        uint256 timestamp;
        string message;
        uint256 globalIndex;
    }

    DialogueEntry[] public dialogues;
    mapping(address => uint256[]) public participantDialogueIndices;

    event DialogueAdded(
        address indexed sender, 
        address indexed receiver, 
        uint256 timestamp, 
        uint256 globalIndex
    );

    function addDialogue(address _receiver, string calldata _message) external {
        require(_receiver != address(0), "Receiver cannot be zero address");
        require(bytes(_message).length > 0, "Message cannot be empty");
        require(msg.sender != _receiver, "Sender and receiver cannot be the same");

        uint256 newIndex = dialogues.length;
        dialogues.push(DialogueEntry({
            sender: msg.sender,
            receiver: _receiver,
            timestamp: block.timestamp,
            message: _message,
            globalIndex: newIndex
        }));

        participantDialogueIndices[msg.sender].push(newIndex);
        participantDialogueIndices[_receiver].push(newIndex);

        emit DialogueAdded(msg.sender, _receiver, block.timestamp, newIndex);
    }

    function getDialogue(uint256 _index) external view returns (
        address sender, address receiver, uint256 timestamp, string memory message
    ) {
        require(_index < dialogues.length, "Dialogue index out of bounds");
        DialogueEntry storage entry = dialogues[_index];
        return (entry.sender, entry.receiver, entry.timestamp, entry.message);
    }
}