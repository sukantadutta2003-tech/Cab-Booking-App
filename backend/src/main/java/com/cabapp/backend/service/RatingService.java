package com.cabapp.backend.service;

import com.cabapp.backend.dto.RatingDTO;
import com.cabapp.backend.entity.Driver;
import com.cabapp.backend.entity.Rating;
import com.cabapp.backend.entity.Ride;
import com.cabapp.backend.entity.Ride.RideStatus;
import com.cabapp.backend.entity.User;
import com.cabapp.backend.repository.DriverRepository;
import com.cabapp.backend.repository.RatingRepository;
import com.cabapp.backend.repository.RideRepository;
import com.cabapp.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RatingService {

    private final RatingRepository ratingRepository;
    private final RideRepository rideRepository;
    private final UserRepository userRepository;
    private final DriverRepository driverRepository;

    // === SUBMIT RATING ===
    @Transactional
    public RatingDTO submitRating(RatingDTO request, String riderEmail) {
        User rider = userRepository.findByEmail(riderEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Ride ride = rideRepository.findById(request.getRideId())
                .orElseThrow(() -> new RuntimeException("Ride not found: " + request.getRideId()));

        // Only rider of this ride can rate
        if (!ride.getRider().getId().equals(rider.getId())) {
            throw new RuntimeException("You are not authorized to rate this ride");
        }

        // Ride must be COMPLETED
        if (ride.getStatus() != RideStatus.COMPLETED) {
            throw new RuntimeException("You can only rate a COMPLETED ride");
        }

        // One rating per ride
        if (ratingRepository.findByRideId(ride.getId()).isPresent()) {
            throw new RuntimeException("You have already rated this ride");
        }

        // Validate stars range
        if (request.getStars() < 1 || request.getStars() > 5) {
            throw new RuntimeException("Stars must be between 1 and 5");
        }

        Driver driver = ride.getDriver();
        if (driver == null) {
            throw new RuntimeException("No driver assigned to this ride");
        }

        Rating rating = new Rating();
        rating.setRide(ride);
        rating.setRatedBy(rider);
        rating.setDriver(driver);
        rating.setStars(request.getStars());
        rating.setComment(request.getComment());

        ratingRepository.save(rating);

        // Recalculate and persist driver average rating
        Double avg = ratingRepository.findAverageRatingByDriverId(driver.getId());
        if (avg != null) {
            driver.setRating(Math.round(avg * 10.0) / 10.0);
            driverRepository.save(driver);
        }

        return mapToDTO(rating, driver);
    }

    // === GET ALL RATINGS FOR A DRIVER ===
    public List<RatingDTO> getDriverRatings(Long driverId) {
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new RuntimeException("Driver not found: " + driverId));
        return ratingRepository.findByDriverId(driverId)
                .stream()
                .map(r -> mapToDTO(r, driver))
                .collect(Collectors.toList());
    }

    // === GET RATING FOR A SPECIFIC RIDE ===
    public RatingDTO getRatingForRide(Long rideId) {
        Rating rating = ratingRepository.findByRideId(rideId)
                .orElseThrow(() -> new RuntimeException("No rating found for ride: " + rideId));
        return mapToDTO(rating, rating.getDriver());
    }

    // === MAP ENTITY → DTO ===
    private RatingDTO mapToDTO(Rating rating, Driver driver) {
        RatingDTO dto = new RatingDTO();
        dto.setId(rating.getId());
        dto.setRideId(rating.getRide().getId());
        dto.setStars(rating.getStars());
        dto.setComment(rating.getComment());
        dto.setCreatedAt(rating.getCreatedAt());
        dto.setDriverName(driver.getUser().getUsername());
        dto.setDriverAverageRating(driver.getRating());
        return dto;
    }
}
