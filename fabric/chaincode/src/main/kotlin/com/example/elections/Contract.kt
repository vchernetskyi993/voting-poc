package com.example.elections

import org.hyperledger.fabric.contract.Context
import org.hyperledger.fabric.contract.ContractInterface
import org.hyperledger.fabric.contract.annotation.Contract
import org.hyperledger.fabric.contract.annotation.Default
import org.hyperledger.fabric.contract.annotation.Transaction
import java.time.Instant

@Contract(name = "elections")
@Default
class Contract : ContractInterface {

    @Transaction(intent = Transaction.TYPE.SUBMIT, name = "CreateElection")
    fun createElection(ctx: Context, electionJson: String): String = handleExceptions {
        expect("Only Government is allowed to create election.") {
            ctx.clientIdentity.mspid == "Government"
        }

        val election: Election = electionJson.toJsonEntity()
        expect("Start date should be in the future") {
            election.start > Instant.now().epochSecond
        }
        expect("Start date should be before the end") {
            election.start < election.end
        }
        expect("At least 2 candidates are required") {
            election.candidates.size > 1
        }

        val id = ctx.electionsCount()
        ctx.saveElection(id, election)
        ctx.incrementElectionsCount()
        id.toString()
    }

    @Transaction(intent = Transaction.TYPE.EVALUATE, name = "FetchElection")
    fun fetchElection(ctx: Context, idString: String): String = handleExceptions {
        val id = idString.toBigInteger()
        val election = ctx.fetchElection(id)
        val results = election.candidates.asSequence()
            .mapIndexed { i, _ -> Pair(i, ctx.votesCount(id, i)) }
            .toMap()
        ElectionWithResults(election, results).toJsonString()
    }

    @Transaction(intent = Transaction.TYPE.EVALUATE, name = "ElectionsCount")
    fun electionsCount(ctx: Context): String = handleExceptions {
        ctx.electionsCount().toString()
    }

    @Transaction(intent = Transaction.TYPE.SUBMIT, name = "Vote")
    fun vote(ctx: Context, voteJson: String): Unit = handleExceptions {
        val vote: Vote = voteJson.toJsonEntity()
        val election = ctx.fetchElection(vote.electionId)
        expect("Election has not started yet") {
            election.start < Instant.now().epochSecond
        }
        expect("Election has already ended") {
            election.end > Instant.now().epochSecond
        }
        expect("User already voted") {
            ctx.canVote(vote.electionId, vote.voterId)
        }
        ctx.incrementVotesCount(vote.electionId, vote.candidateId)
        ctx.setVoted(vote.electionId, vote.voterId)
    }

    @Transaction(intent = Transaction.TYPE.EVALUATE, name = "Voted")
    fun canVote(ctx: Context, electionId: String, userId: String): Boolean = handleExceptions {
        ctx.canVote(electionId.toBigInteger(), userId.toBigInteger())
    }
}