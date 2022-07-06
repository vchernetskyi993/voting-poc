package com.example.elections

import org.hyperledger.fabric.contract.Context
import org.hyperledger.fabric.contract.ContractInterface
import org.hyperledger.fabric.contract.annotation.Contract
import org.hyperledger.fabric.contract.annotation.Default
import org.hyperledger.fabric.contract.annotation.Transaction

@Contract(name = "elections")
@Default
class Contract : ContractInterface {

    @Transaction(intent = Transaction.TYPE.SUBMIT, name = "StoreGreeting")
    fun storeGreeting(ctx: Context, id: Long, value: String) =
        ctx.stub.putStringState(id.toString(), value)

    @Transaction(intent = Transaction.TYPE.EVALUATE, name = "FetchGreeting")
    fun fetchGreeting(ctx: Context, id: Long): String =
        ctx.stub.getStringState(id.toString())
}