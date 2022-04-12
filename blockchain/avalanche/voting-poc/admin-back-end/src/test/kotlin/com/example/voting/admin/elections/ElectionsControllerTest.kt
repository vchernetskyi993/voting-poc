package com.example.voting.admin.elections

import kotlinx.coroutines.runBlocking
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.add
import kotlinx.serialization.json.addJsonObject
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.int
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put
import kotlinx.serialization.json.putJsonArray
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.test.web.reactive.server.WebTestClient
import org.springframework.test.web.reactive.server.returnResult
import org.springframework.web.reactive.function.BodyInserters
import voting.ElectionsOuterClass.uint256
import voting.candidate
import voting.election
import voting.newElection

@SpringBootTest(
    properties = [
        "grpc.server.inProcessName=test",
        "grpc.server.port=-1",
        "grpc.client.electionsService.address=in-process:test",
    ],
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
)
class ElectionsControllerTest @Autowired constructor(
    private val webClient: WebTestClient,
    private val testServer: TestElectionsService,
) {
    @AfterEach
    fun afterEach() {
        testServer.clear()
    }

    @Test
    fun `Should create election`() = runBlocking {
        // when
        val response = webClient.post()
            .uri("/elections")
            .accept(MediaType.APPLICATION_JSON)
            .body(BodyInserters.fromValue(newElectionJson()))
            .exchange()
            .expectStatus().isCreated
            .returnResult<JsonObject>()
            .responseBodyContent!!

        // then
        val savedId = Json.decodeFromString<JsonObject>(
            String(response)
        )["id"]!!.jsonPrimitive.int.toUint256()
        assertEquals(savedElectionProto(savedId), testServer.getElection(savedId))
    }

    @Test
    fun `Should get existing`() = runBlocking {
        // given
        val electionId = testServer.createElection(newElectionProto()).toInt()

        // when
        val response = webClient.get()
            .uri("/elections/$electionId")
            .exchange()
            .expectStatus().isOk
            .returnResult<JsonObject>()
            .responseBodyContent!!

        // then
        val actualElection = Json.decodeFromString<JsonObject>(String(response))
        assertEquals(savedElectionJson(electionId), actualElection)
    }

    @Test
    fun `Should get first page by default`() {
        // given
        repeat(13) { runBlocking { testServer.createElection(newElectionProto()) } }

        // when
        val responseBytes = webClient.get()
            .uri("/elections")
            .exchange()
            .expectStatus().isOk
            .returnResult<JsonObject>()
            .responseBodyContent!!

        // then
        assertEquals(
            savedPage(
                elementsCount = 13,
                pageCount = 2
            ),
            Json.decodeFromString<JsonObject>(String(responseBytes))
        )
    }

    @Test
    fun `Should get requested page`() {
        // given
        repeat(33) { runBlocking { testServer.createElection(newElectionProto()) } }

        // when
        val responseBytes = webClient.get()
            .uri {
                it.path("/elections")
                    .queryParam("page", 2)
                    .queryParam("pageSize", 15)
                    .build()
            }
            .exchange()
            .expectStatus().isOk
            .returnResult<JsonObject>()
            .responseBodyContent!!

        // then
        assertEquals(
            savedPage(
                pageNumber = 2,
                pageSize = 15,
                elementsCount = 33,
                pageCount = 3,
                fromId = 15,
                toId = 29,
            ),
            Json.decodeFromString<JsonObject>(String(responseBytes))
        )
    }

    @Test
    fun `Should get incomplete last page`() {
        // given
        repeat(18) { runBlocking { testServer.createElection(newElectionProto()) } }

        // when
        val responseBytes = webClient.get()
            .uri {
                it.path("/elections")
                    .queryParam("page", 2)
                    .build()
            }
            .exchange()
            .expectStatus().isOk
            .returnResult<JsonObject>()
            .responseBodyContent!!

        // then
        assertEquals(
            savedPage(
                pageNumber = 2,
                pageSize = 8,
                elementsCount = 18,
                pageCount = 2,
                fromId = 10,
                toId = 17,
            ),
            Json.decodeFromString<JsonObject>(String(responseBytes))
        )
    }

    @Test
    fun `Should get incomplete first page`() {
        // given
        repeat(12) { runBlocking { testServer.createElection(newElectionProto()) } }

        // when
        val responseBytes = webClient.get()
            .uri {
                it.path("/elections")
                    .queryParam("pageSize", 13)
                    .build()
            }
            .exchange()
            .expectStatus().isOk
            .returnResult<JsonObject>()
            .responseBodyContent!!

        // then
        assertEquals(
            savedPage(
                pageSize = 12,
                elementsCount = 12,
                pageCount = 1,
                toId = 11,
            ),
            Json.decodeFromString<JsonObject>(String(responseBytes))
        )
    }

    private fun newElectionJson() = buildJsonObject {
        put("start", 1)
        put("end", 2)
        put("title", "Some title")
        put("description", "Some description")
        put("candidates", buildJsonArray {
            add("First")
            add("Second")
        })
    }

    private fun newElectionProto() = newElection {
        start = 1
        end = 2
        title = "Some title"
        description = "Some description"
        candidates.addAll(listOf("First", "Second"))
    }

    private fun savedElectionJson(electionId: Int) = buildJsonObject {
        put("id", electionId)
        put("start", 1)
        put("end", 2)
        put("title", "Some title")
        put("description", "Some description")
        putJsonArray("candidates") {
            addJsonObject {
                put("name", "First")
                put("votes", 0)
            }
            addJsonObject {
                put("name", "Second")
                put("votes", 0)
            }
        }
    }

    private fun savedElectionProto(electionId: uint256) = election {
        id = electionId
        start = 1
        end = 2
        title = "Some title"
        description = "Some description"
        candidates.addAll(
            listOf(
                candidate { name = "First"; votes = 0.toUint256() },
                candidate { name = "Second"; votes = 0.toUint256() },
            )
        )
    }

    private fun savedPage(
        elementsCount: Int,
        pageCount: Int,
        pageNumber: Int = 1,
        pageSize: Int = 10,
        fromId: Int = 0,
        toId: Int = 9,
    ) = buildJsonObject {
        put("pageNumber", pageNumber)
        put("pageSize", pageSize)
        put("elementsCount", elementsCount)
        put("pageCount", pageCount)
        putJsonArray("values") {
            for (i in fromId..toId) {
                add(savedElectionJson(i))
            }
        }
    }
}