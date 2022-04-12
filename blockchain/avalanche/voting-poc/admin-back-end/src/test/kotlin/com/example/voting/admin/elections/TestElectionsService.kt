package com.example.voting.admin.elections

import com.google.protobuf.Empty
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.asFlow
import net.devh.boot.grpc.server.service.GrpcService
import voting.ElectionsGrpcKt.ElectionsCoroutineImplBase
import voting.ElectionsOuterClass.Election
import voting.ElectionsOuterClass.NewElection
import voting.ElectionsOuterClass.uint256
import voting.election

@GrpcService
class TestElectionsService : ElectionsCoroutineImplBase(Dispatchers.Default) {
    private val elections: MutableList<Election> = mutableListOf()

    override suspend fun createElection(request: NewElection): uint256 {
        val index = elections.size.toUint256()
        elections.add(election {
            id = index
            start = request.start
            end = request.end
            title = request.title
            description = request.description
            candidates.addAll(request.candidatesList.map(::candidate))
        })
        return index
    }

    override suspend fun getElection(request: uint256): Election {
        return elections[request.toInt()]
    }

    override suspend fun electionsCount(request: Empty): uint256 {
        return elections.size.toUint256()
    }

    override fun streamElections(request: uint256): Flow<Election> {
        return elections.asFlow()
    }

    private fun candidate(inputName: String) = voting.candidate {
        name = inputName
        votes = 0.toUint256()
    }
}