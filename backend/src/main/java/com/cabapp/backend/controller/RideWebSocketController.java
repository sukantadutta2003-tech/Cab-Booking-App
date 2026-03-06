package com.cabapp.backend.controller;

import com.cabapp.backend.dto.RideResponseDTO;
import com.cabapp.backend.service.RideService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class RideWebSocketController {

    private final RideService rideService;

    /**
     * Client sends to: /app/ride/{rideId}/status
     * Server broadcasts to: /topic/ride/{rideId}
     *
     * Any client (rider or driver) can request latest ride state via WebSocket.
     * This also allows clients to subscribe and get initial state on connect.
     */
    @MessageMapping("/ride/{rideId}/status")
    @SendTo("/topic/ride/{rideId}")
    public RideResponseDTO getRideStatus(@DestinationVariable Long rideId) {
        return rideService.getRideById(rideId);
    }
}
