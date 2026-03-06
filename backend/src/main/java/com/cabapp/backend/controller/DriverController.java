package com.cabapp.backend.controller;

import com.cabapp.backend.dto.DriverStatusDTO;
import com.cabapp.backend.dto.RideResponseDTO;
import com.cabapp.backend.service.DriverService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/driver")
@RequiredArgsConstructor
public class DriverController {

    private final DriverService driverService;

    /**
     * GET /api/driver/rides/pending
     * Get all rides with REQUESTED status (available for acceptance)
     */
    @GetMapping("/rides/pending")
    public ResponseEntity<List<RideResponseDTO>> getPendingRides(Authentication auth) {
        return ResponseEntity.ok(driverService.getPendingRides(auth.getName()));
    }

    /**
     * PUT /api/driver/rides/{id}/accept
     * Accept a ride request
     */
    @PutMapping("/rides/{id}/accept")
    public ResponseEntity<RideResponseDTO> acceptRide(
            Authentication auth,
            @PathVariable Long id) {
        return ResponseEntity.ok(driverService.acceptRide(id, auth.getName()));
    }

    /**
     * PUT /api/driver/rides/{id}/reject
     * Reject / unassign from a ride
     */
    @PutMapping("/rides/{id}/reject")
    public ResponseEntity<RideResponseDTO> rejectRide(
            Authentication auth,
            @PathVariable Long id) {
        return ResponseEntity.ok(driverService.rejectRide(id, auth.getName()));
    }

    /**
     * PUT /api/driver/rides/{id}/start
     * Mark ride as IN_PROGRESS (driver has picked up rider)
     */
    @PutMapping("/rides/{id}/start")
    public ResponseEntity<RideResponseDTO> startRide(
            Authentication auth,
            @PathVariable Long id) {
        return ResponseEntity.ok(driverService.startRide(id, auth.getName()));
    }

    /**
     * PUT /api/driver/rides/{id}/complete
     * Mark ride as COMPLETED
     */
    @PutMapping("/rides/{id}/complete")
    public ResponseEntity<RideResponseDTO> completeRide(
            Authentication auth,
            @PathVariable Long id) {
        return ResponseEntity.ok(driverService.completeRide(id, auth.getName()));
    }

    /**
     * PUT /api/driver/status
     * Update driver availability status and GPS location
     */
    @PutMapping("/status")
    public ResponseEntity<Map<String, Object>> updateStatus(
            Authentication auth,
            @RequestBody DriverStatusDTO dto) {
        return ResponseEntity.ok(driverService.updateStatus(auth.getName(), dto));
    }

    /**
     * GET /api/driver/earnings
     * Get driver earnings summary
     */
    @GetMapping("/earnings")
    public ResponseEntity<Map<String, Object>> getEarnings(Authentication auth) {
        return ResponseEntity.ok(driverService.getEarnings(auth.getName()));
    }

    /**
     * GET /api/driver/rides/history
     * Get driver's full ride history
     */
    @GetMapping("/rides/history")
    public ResponseEntity<List<RideResponseDTO>> getMyRides(Authentication auth) {
        return ResponseEntity.ok(driverService.getMyRides(auth.getName()));
    }
}
