package com.cabapp.backend.controller;

import com.cabapp.backend.dto.RideRequestDTO;
import com.cabapp.backend.dto.RideResponseDTO;
import com.cabapp.backend.service.RideService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rides")
@RequiredArgsConstructor
public class RideController {

    private final RideService rideService;

    /**
     * POST /api/rides/book
     * Book a new ride (RIDER only)
     */
    @PostMapping("/book")
    public ResponseEntity<RideResponseDTO> bookRide(
            Authentication auth,
            @RequestBody RideRequestDTO request) {
        return ResponseEntity.ok(rideService.bookRide(auth.getName(), request));
    }

    /**
     * GET /api/rides/{id}
     * Get details of a specific ride
     */
    @GetMapping("/{id}")
    public ResponseEntity<RideResponseDTO> getRide(@PathVariable Long id) {
        return ResponseEntity.ok(rideService.getRideById(id));
    }

    /**
     * PUT /api/rides/{id}/cancel
     * Cancel a ride (RIDER only, before IN_PROGRESS)
     */
    @PutMapping("/{id}/cancel")
    public ResponseEntity<RideResponseDTO> cancelRide(
            Authentication auth,
            @PathVariable Long id) {
        return ResponseEntity.ok(rideService.cancelRide(id, auth.getName()));
    }

    /**
     * GET /api/rides/history
     * Rider's ride history (most recent first)
     */
    @GetMapping("/history")
    public ResponseEntity<List<RideResponseDTO>> getRideHistory(Authentication auth) {
        return ResponseEntity.ok(rideService.getRideHistory(auth.getName()));
    }
}
