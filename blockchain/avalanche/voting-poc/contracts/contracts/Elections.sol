// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract Elections {
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

    // TODO: limit to admins only
    function createElection(Election calldata election) external {
        require(
            election.start > block.timestamp,
            "Start should be in the future"
        );
        // TODO: implement
        emit ElectionCreated(lastElectionId++, election);
    }
}
