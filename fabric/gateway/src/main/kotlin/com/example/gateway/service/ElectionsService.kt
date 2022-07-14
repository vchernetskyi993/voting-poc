package com.example.gateway.service

import com.example.gateway.model.Election
import com.example.gateway.model.ElectionWithResults
import com.example.gateway.model.Page
import com.example.gateway.util.CurrentUserHolder
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.node.ObjectNode
import com.fasterxml.jackson.module.kotlin.convertValue
import com.fasterxml.jackson.module.kotlin.readValue
import org.hyperledger.fabric.client.Contract
import org.springframework.stereotype.Service
import java.math.BigInteger
import java.math.RoundingMode

@Service
class ElectionsService(
    private val userHolder: CurrentUserHolder,
    private val contract: Contract,
    private val mapper: ObjectMapper,
) {
    fun createElection(election: Election): BigInteger =
        contract.submitTransaction(
            "CreateElection",
            mapper.writeValueAsBytes(election)
        )
            .decodeToString()
            .toBigInteger()

    fun fetchElection(electionId: BigInteger): ElectionWithResults {
        val election = mapper.readValue<ObjectNode>(
            contract.evaluateTransaction(
                "FetchElection",
                electionId.toString()
            )
        )
        val canVote = contract.evaluateTransaction(
            "CanVote",
            electionId.toString(),
            userHolder.user.id.toString(),
        ).decodeToString().toBooleanStrict()
        election.put("canVote", canVote)
        return mapper.convertValue(election)
    }

    fun paginatedElections(page: BigInteger, pageSize: Int): Page<ElectionWithResults> {
        val total = electionsCount()
        val start = page.dec().multiply(pageSize.toBigInteger())
        val pageCount = total.toBigDecimal()
            .divide(pageSize.toBigDecimal(), RoundingMode.CEILING)
            .toBigInteger()
        val actualSize = when (page) {
            pageCount -> total.rem(pageSize.toBigInteger()).toInt()
            else -> pageSize
        }
        val elections = generateSequence(start, BigInteger::inc)
            .map { i -> fetchElection(i) }
            .take(actualSize)
            .toList()
        return Page(
            pageNumber = page,
            pageSize = elections.size,
            pageCount = pageCount,
            elementsCount = total,
            values = elections,
        )
    }

    private fun electionsCount(): BigInteger =
        contract.evaluateTransaction("ElectionsCount")
            .decodeToString()
            .toBigInteger()

    fun vote(electionId: BigInteger, candidateId: Int) {
        contract.submitTransaction(
            "Vote",
            mapper.writeValueAsBytes(
                mapper.createObjectNode()
                    .put("electionId", electionId.toString())
                    .put("candidateId", candidateId)
                    .put("voterId", userHolder.user.id.toString())
            )
        )
    }
}
