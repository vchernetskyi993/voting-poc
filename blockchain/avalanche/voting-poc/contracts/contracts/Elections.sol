// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
    @title Contract to conduct elections
    @notice Any number of candidates is accepted. 
        Anyone can vote. Only owner can create new election.
 */
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

    /**
        @dev These id is started from 0 and incremented by one. 
            So, it should be used to get all elections or election ranges (e.g. for pagination).
        @return Id of the previously created election.
     */
    uint256 public lastElectionId;
    Election[] private elections;
    mapping(uint256 => mapping(uint256 => uint256)) private results;
    mapping(uint256 => mapping(address => bool)) private voters;

    event ElectionCreated(uint256 electionId, Election election);
    event Voted(uint256 electionId, uint256 candidateId);

    /**
        @notice Create new election using provided data. Only owner can call this function.
        @param election Valid data to schedule new election with (see 'Election' struct).
        @dev Dates should be in the future and start less then end.
            Emits 'ElectionCreated' event.
     */
    function createElection(Election calldata election) external onlyOwner {
        require(
            election.start > block.timestamp,
            "Start should be in the future"
        );
        require(election.start < election.end, "Start should be before end");
        elections.push(election);
        emit ElectionCreated(lastElectionId++, election);
    }

    /**
        @notice Fetch election by id.
        @return 'Election' struct
     */
    function getElection(uint256 electionId)
        external
        view
        returns (Election memory)
    {
        return elections[electionId];
    }

    /**
        @notice Vote for candidate in election. Each user can vote only once. 
            Users can vote only during election time (i.e. current date between start and end of election).
        @dev Emits 'Voted' event.
     */
    function vote(uint256 electionId, uint256 candidateId) external {
        require(electionId <= elections.length, "Election id invalid");
        require(!voters[electionId][msg.sender], "User already voted");
        Election memory election = elections[electionId];
        require(
            candidateId < election.candidates.length,
            "Candidate id invalid"
        );
        require(
            block.timestamp >= election.start,
            "Election hasn't started yet"
        );
        require(block.timestamp < election.end, "Election has already ended");
        results[electionId][candidateId]++;
        voters[electionId][msg.sender] = true;
        emit Voted(electionId, candidateId);
    }

    /**
        @notice Get voting results of election.
        @return array of tuples of the form (candidateId, voteCount) (see 'CandidateVotes' struct).
     */
    function getVotingResults(uint256 electionId)
        external
        view
        returns (CandidateVotes[] memory)
    {
        string[] memory candidates = elections[electionId].candidates;
        CandidateVotes[] memory votes = new CandidateVotes[](candidates.length);
        for (uint256 i = 0; i < votes.length; i++) {
            votes[i] = CandidateVotes(i, results[electionId][i]);
        }
        return votes;
    }
}
