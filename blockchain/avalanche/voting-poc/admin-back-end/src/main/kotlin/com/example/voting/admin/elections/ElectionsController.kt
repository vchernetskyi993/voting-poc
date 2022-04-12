package com.example.voting.admin.elections

import com.example.voting.admin.model.Page
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import voting.ElectionsGrpcKt.ElectionsCoroutineStub
import java.math.BigInteger

@RestController
@RequestMapping("/elections")
class ElectionsController(
    val contract: ElectionsCoroutineStub,
) {
    @PostMapping
    suspend fun createElection(
        @RequestBody election: NewElection,
    ): ElectionId = ElectionId(contract.createElection(election.toProto()).toBigInteger())

    @GetMapping("/{electionId}")
    suspend fun getElection(
        @PathVariable("electionId") electionId: BigInteger,
    ): Election = contract.getElection(electionId.toUint256()).toJson()

    @GetMapping
    suspend fun getPage(
        @RequestParam(name = "pageNumber", required = false, defaultValue = "1") pageNumber: Int,
        @RequestParam(name = "pageSize", required = false, defaultValue = "10") pageSize: Int,
    ): Page<Election> = TODO("Paginate")
}