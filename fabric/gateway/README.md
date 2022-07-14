# Elections Gateway

Back-end service that provides access to Fabric network. 
Integration point between blockchain and other system parts.

## Usage

1. Start `../local-network`.

2. Start Gateway as usual Spring Boot app with `development` profile.

Service uses basic auth. For simplification all users are hardcoded 
(see [UserDetailsServiceImpl](src/main/kotlin/com/example/gateway/service/UserDetailsServiceImpl.kt)).
