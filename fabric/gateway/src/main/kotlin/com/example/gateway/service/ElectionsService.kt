package com.example.gateway.service

import com.example.gateway.model.Election
import com.example.gateway.model.ElectionWithResults
import com.example.gateway.model.Page
import org.springframework.stereotype.Service
import java.math.BigInteger

@Service
class ElectionsService(
    private val userHolder: CurrentUserHolder,
) {
    fun createElection(election: Election): BigInteger = TODO()

    fun fetchElection(electionId: BigInteger): ElectionWithResults = TODO()

    fun paginatedElections(page: BigInteger, pageSize: Int): Page<ElectionWithResults> = TODO()

    fun vote(electionId: BigInteger, candidateId: Int): Unit = TODO()
}
