// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Elections is Ownable {
    struct Election {
        uint32 start;
        uint32 end;
        string title;
        string description;
        string[] candidates;
    }

    uint256 public lastElectionId;
    Election[] public elections;

    event ElectionCreated(uint256 electionId, Election election);

    function vote(uint256 electionId, uint256 candidateId) external {
        // TODO: implement
    }

    function createElection(Election calldata election) external onlyOwner {
        require(
            election.start > block.timestamp,
            "Start should be in the future"
        );
        require(election.start < election.end, "Start should be before end");
        elections.push(election);
        emit ElectionCreated(lastElectionId++, election);
    }
}
