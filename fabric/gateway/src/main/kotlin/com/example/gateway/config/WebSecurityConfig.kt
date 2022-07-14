package com.example.gateway.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Profile
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.web.SecurityFilterChain
import org.springframework.web.servlet.config.annotation.CorsRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer


@Configuration
@EnableWebSecurity
class WebSecurityConfig {
    @Bean
    fun webSecurityCustomizer(http: HttpSecurity): SecurityFilterChain =
        http.csrf().disable()
            .cors().and()
            .authorizeRequests().anyRequest().authenticated()
            .and().httpBasic()
            .and().build()

    @Bean
    @Profile("development")
    fun webMvcConfigurer() = object : WebMvcConfigurer {
        override fun addCorsMappings(registry: CorsRegistry) {
            registry.addMapping("/**")
        }
    }

    @Bean
    fun passwordEncoder() = BCryptPasswordEncoder()
}
