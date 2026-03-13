package com.cabapp.backend.controller;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestBody;
import java.util.Map;

@Controller
public class LocationController {

    private final SimpMessagingTemplate messagingTemplate;

    public LocationController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Drivers will publish messages to /app/ride/{rideId}/location
     * We broadcast exactly what they send to /topic/ride/{rideId}/location
     */
    @MessageMapping("/ride/{rideId}/location")
    public void updateDriverLocation(@org.springframework.messaging.handler.annotation.DestinationVariable Long rideId, @RequestBody Map<String, Double> locationData) {
        // locationData will have {"lat": 12.34, "lng": 56.78}
        messagingTemplate.convertAndSend("/topic/ride/" + rideId + "/location", locationData);
    }
}
