package com.example.elections

import org.hyperledger.fabric.contract.Context
import org.hyperledger.fabric.contract.ContractInterface
import org.hyperledger.fabric.contract.annotation.Contract
import org.hyperledger.fabric.contract.annotation.Default
import org.hyperledger.fabric.contract.annotation.Transaction

@Contract(name = "elections")
@Default
class Contract : ContractInterface {

    @Transaction(intent = Transaction.TYPE.SUBMIT, name = "CreateElection")
    fun createElection(ctx: Context, electionJson: String): String = handleExceptions {
        "Election created."
    }

    @Transaction(intent = Transaction.TYPE.EVALUATE, name = "FetchElection")
    fun fetchElection(ctx: Context, id: String): ElectionWithResults = handleExceptions {
        TODO()
    }

    @Transaction(intent = Transaction.TYPE.EVALUATE, name = "ElectionsCount")
    fun electionsCount(ctx: Context): String = handleExceptions {
        TODO()
    }

    @Transaction(intent = Transaction.TYPE.SUBMIT, name = "Vote")
    fun vote(ctx: Context, voteJson: String): Unit = handleExceptions {
        TODO()
    }

    @Transaction(intent = Transaction.TYPE.EVALUATE, name = "Voted")
    fun voted(ctx: Context, electionId: String, userId: String): Boolean = handleExceptions {
        true
    }
}