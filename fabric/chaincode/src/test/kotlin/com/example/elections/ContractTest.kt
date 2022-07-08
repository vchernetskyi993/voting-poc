package com.example.elections

import io.kotest.assertions.throwables.shouldThrow
import io.kotest.matchers.date.shouldBeAfter
import io.kotest.matchers.shouldBe
import io.kotest.matchers.string.shouldContain
import io.kotest.matchers.string.shouldContainIgnoringCase
import io.mockk.every
import io.mockk.justRun
import io.mockk.mockk
import io.mockk.mockkStatic
import io.mockk.slot
import io.mockk.unmockkStatic
import io.mockk.verify
import kotlinx.serialization.json.add
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import kotlinx.serialization.json.putJsonArray
import org.hyperledger.fabric.contract.Context
import org.hyperledger.fabric.shim.ChaincodeException
import org.hyperledger.fabric.shim.ChaincodeStub
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.MethodSource
import org.junit.jupiter.params.provider.NullAndEmptySource
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.stream.Stream

private const val COUNT_KEY = "electionsCount"
private const val COUNT = "5"
private const val NEW_COUNT = "6"

class ContractTest {

    private val stub = mockk<ChaincodeStub>()
    private val ctx = mockk<Context>()
    private val contract = Contract()

    @BeforeAll
    fun beforeAll() {
        every { ctx.stub } returns stub
    }

    @Test
    fun playground() {
        val now = Instant.now().minus(1, ChronoUnit.DAYS)
        mockkStatic(Instant::class)
        every { Instant.now() } returns now
        Instant.now() shouldBe now
        unmockkStatic(Instant::class)
        now.plus(1, ChronoUnit.DAYS) shouldBeAfter now
    }

    @Nested
    inner class CreateElections {

        @BeforeEach
        fun beforeEach() {
            every { ctx.clientIdentity.mspid } returns "Government"
        }

        @Test
        fun `Should create election`() {
            // given
            val input = election().toString()
            every { stub.getStringState(COUNT_KEY) } returns COUNT
            val storedId = slot<String>()
            val storedValue = slot<String>()
            val newCount = slot<String>()
            justRun { stub.putStringState(capture(storedId), capture(storedValue)) }
            justRun { stub.putStringState(COUNT_KEY, capture(newCount)) }

            // when
            val id = contract.createElection(ctx, input)

            // then
            id shouldBe COUNT
            verify(exactly = 2) { stub.putStringState(any(), any()) }
            storedId.captured shouldBe COUNT
            storedValue.captured shouldBe input
            newCount.captured shouldBe NEW_COUNT
        }

        @Test
        fun `Should prohibit non-government to create`() {
            // given
            val input = election()
            every { ctx.clientIdentity.mspid } returns "Communists"

            // when
            val thrown = shouldThrow<ChaincodeException> {
                contract.createElection(ctx, input.toString())
            }

            // then
            thrown.message shouldContainIgnoringCase "only government"
        }

        @Test
        fun `Should validate start date`() {
            // given
            val input = election(start = Instant.now().minus(1, ChronoUnit.DAYS))

            // when
            val thrown = shouldThrow<ChaincodeException> {
                contract.createElection(ctx, input.toString())
            }

            // then
            thrown.message shouldContain "in the future"
        }

        @Test
        fun `Should validate end date`() {
            // given
            val input = election(end = Instant.now().plus(8, ChronoUnit.HOURS))

            // when
            val thrown = shouldThrow<ChaincodeException> {
                contract.createElection(ctx, input.toString())
            }

            // then
            thrown.message shouldContain "before"
        }

        @ParameterizedTest
        @MethodSource("invalidCandidates")
        fun `Should validate candidates`(candidates: List<String>) {
            // given
            val input = election(candidates = candidates)

            // when
            val thrown = shouldThrow<ChaincodeException> {
                contract.createElection(ctx, input.toString())
            }

            // then
            thrown.message shouldContainIgnoringCase "at least 2"
        }

        private fun invalidCandidates() =
            Stream.of(listOf(), listOf("John Doe"))

    }

    @Nested
    inner class FetchElections {
        @Test
        fun `Should fetch election`() {
            // given
            val input = election()
            every { stub.getStringState(COUNT) } returns input.toString()

            // when
            val actual = contract.fetchElection(ctx, COUNT)

            // then
            val expected = buildJsonObject { put("data", input) }.toString()
            actual shouldBe expected
        }

        @Test
        fun `Should fetch election count`() {
            // given
            every { stub.getStringState(COUNT_KEY) } returns COUNT

            // when
            val actual = contract.electionsCount(ctx)

            // then
            actual shouldBe COUNT
        }

        @ParameterizedTest
        @NullAndEmptySource
        fun `Should return 0 when no elections present`(state: String?) {
            // given
            every { stub.getStringState(COUNT_KEY) } returns state

            // when
            val actual = contract.electionsCount(ctx)

            // then
            actual shouldBe "0"
        }
    }

    @Nested
    inner class Vote {
        @Test
        fun `Should vote`() {

        }

        @Test
        fun `Should prohibit to vote twice`() {

        }

        @Test
        fun `Should check start date`() {

        }

        @Test
        fun `Should check end date`() {

        }
    }

    private fun election(
        start: Instant = Instant.now().plus(1, ChronoUnit.DAYS),
        end: Instant = Instant.now().plus(3, ChronoUnit.DAYS),
        candidates: List<String>? = listOf("John Doe", "Bill Boe"),
    ) =
        buildJsonObject {
            put("start", start.epochSecond)
            put("end", end.epochSecond)
            put("title", "Elections")
            put("description", "Urgent elections")
            putJsonArray("candidates") {
                candidates?.forEach { add(it) }
            }
        }
}