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

    struct CandidateVotes {
        uint256 candidateId;
        uint256 votes;
    }

    uint256 public lastElectionId;
    Election[] private elections;
    mapping(uint256 => mapping(uint256 => uint256)) private results;

    event ElectionCreated(uint256 electionId, Election election);
    event Voted(uint256 electionId, uint256 candidateId);

    function createElection(Election calldata election) external onlyOwner {
        require(
            election.start > block.timestamp,
            "Start should be in the future"
        );
        require(election.start < election.end, "Start should be before end");
        elections.push(election);
        emit ElectionCreated(lastElectionId++, election);
    }

    function getElection(uint256 electionId)
        external
        view
        returns (Election memory)
    {
        return elections[electionId];
    }

    function vote(uint256 electionId, uint256 candidateId) external {
        require(
            electionId >= 0 && electionId <= elections.length,
            "Election id invalid"
        );
        Election memory election = elections[electionId];
        require(
            candidateId >= 0 && candidateId < election.candidates.length,
            "Candidate id invalid"
        );
        require(
            block.timestamp >= election.start,
            "Election hasn't started yet"
        );
        require(block.timestamp < election.end, "Election has already ended");

        emit Voted(electionId, candidateId);
    }

    function getVotingResults(uint256 electionId)
        external
        view
        returns (CandidateVotes[] memory)
    {}
}
