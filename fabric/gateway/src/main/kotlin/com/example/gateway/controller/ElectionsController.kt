package com.example.gateway.controller

import com.example.gateway.model.Election
import com.example.gateway.service.ElectionsService
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.math.BigInteger

@RestController
@RequestMapping("/elections")
class ElectionsController(
    private val elections: ElectionsService,
) {
    @PostMapping
    fun createElection(@RequestBody election: Election) =
        mapOf(Pair("id", elections.createElection(election)))

    @GetMapping("/{electionId}")
    fun fetchElection(@PathVariable electionId: BigInteger) = elections.fetchElection(electionId)

    @GetMapping
    fun paginatedElections(
        @RequestParam(defaultValue = "1") page: BigInteger,
        @RequestParam(defaultValue = "10") pageSize: Int,
    ) = elections.paginatedElections(page, pageSize)

    @PostMapping("/{electionId}/vote/{candidateId}")
    fun vote(
        @PathVariable electionId: BigInteger,
        @PathVariable candidateId: Int,
    ) = elections.vote(electionId, candidateId)
}
