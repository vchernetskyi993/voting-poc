package com.example.gateway.service

import com.example.gateway.model.UserDetailsImpl
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.security.core.userdetails.UsernameNotFoundException
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service

@Service
class UserDetailsServiceImpl(
    encoder: PasswordEncoder,
) : UserDetailsService {
    private val users = mapOf(
        Pair("john", UserDetailsImpl(0, "john", encoder.encode("Password1!"))),
        Pair("bob", UserDetailsImpl(1, "bob", encoder.encode("Password1!"))),
        Pair("charlie", UserDetailsImpl(2, "charlie", encoder.encode("Password1!"))),
        Pair("ann", UserDetailsImpl(3, "ann", encoder.encode("Password1!"))),
        Pair("kelly", UserDetailsImpl(4, "kelly", encoder.encode("Password1!"))),
        Pair("sophie", UserDetailsImpl(5, "sophie", encoder.encode("Password1!"))),
    )

    override fun loadUserByUsername(username: String?): UserDetails {
        return when (username) {
            in users -> users[username]!!
            else -> throw UsernameNotFoundException(username)
        }
    }
}
