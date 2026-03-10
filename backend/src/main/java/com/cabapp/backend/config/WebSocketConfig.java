package com.cabapp.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Client subscribes to /topic/... prefixes (server → client broadcasts)
        registry.enableSimpleBroker("/topic");
        // Client sends messages to /app/... prefixes (client → server)
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Value("${app.cors.allowed-origins:http://localhost:3000,http://localhost:5173}")
    private String allowedOriginsRaw;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // WebSocket handshake endpoint – supports SockJS fallback for older browsers
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(allowedOriginsRaw.split(","))
                .withSockJS();
    }
}
