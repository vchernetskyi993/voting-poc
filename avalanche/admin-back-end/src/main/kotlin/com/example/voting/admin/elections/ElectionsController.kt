package com.example.voting.admin.elections

import com.example.voting.admin.model.Page
import com.google.protobuf.empty
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.take
import kotlinx.coroutines.flow.toList
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import voting.ElectionsGrpcKt.ElectionsCoroutineStub
import java.math.BigDecimal
import java.math.BigInteger
import java.math.RoundingMode

@RestController
@RequestMapping("/elections")
class ElectionsController(
    val contract: ElectionsCoroutineStub,
) {
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    suspend fun createElection(
        @RequestBody election: NewElection,
    ): ElectionId = ElectionId(contract.createElection(election.toProto()).toBigInteger())

    @GetMapping("/{electionId}")
    suspend fun getElection(
        @PathVariable("electionId") electionId: BigInteger,
    ): Election = contract.getElection(electionId.toUint256()).toJson()

    @GetMapping
    suspend fun getPage(
        @RequestParam(name = "page", required = false, defaultValue = "1") pageNumber: Int,
        @RequestParam(name = "pageSize", required = false, defaultValue = "10") pageSize: Int,
    ): Page<Election> {
        val total = contract.electionsCount(empty {}).toBigInteger()
        val start = BigInteger.valueOf(pageSize * (pageNumber - 1).toLong())
        val elections = contract.streamElections(start.toUint256())
            .take(pageSize)
            .map { it.toJson() }
            .toList()
        return Page(
            pageNumber = pageNumber,
            pageSize = elections.size,
            pageCount = BigDecimal(total).divide(BigDecimal(pageSize), RoundingMode.CEILING).toBigInteger(),
            elementsCount = total,
            values = elections,
        )

    }
}