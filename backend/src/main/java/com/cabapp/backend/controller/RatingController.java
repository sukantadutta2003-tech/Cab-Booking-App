package com.cabapp.backend.controller;

import com.cabapp.backend.dto.RatingDTO;
import com.cabapp.backend.service.RatingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ratings")
@RequiredArgsConstructor
public class RatingController {

    private final RatingService ratingService;

    // POST /api/ratings/submit — Rider submits a rating
    @PostMapping("/submit")
    public ResponseEntity<RatingDTO> submitRating(
            @RequestBody RatingDTO request,
            Authentication auth) {
        return ResponseEntity.ok(ratingService.submitRating(request, auth.getName()));
    }

    // GET /api/ratings/driver/{driverId} — All ratings for a driver
    @GetMapping("/driver/{driverId}")
    public ResponseEntity<List<RatingDTO>> getDriverRatings(@PathVariable Long driverId) {
        return ResponseEntity.ok(ratingService.getDriverRatings(driverId));
    }

    // GET /api/ratings/ride/{rideId} — Rating for a specific ride
    @GetMapping("/ride/{rideId}")
    public ResponseEntity<RatingDTO> getRatingForRide(@PathVariable Long rideId) {
        return ResponseEntity.ok(ratingService.getRatingForRide(rideId));
    }
}
