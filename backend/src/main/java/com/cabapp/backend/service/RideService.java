package com.cabapp.backend.service;

import com.cabapp.backend.dto.RideRequestDTO;
import com.cabapp.backend.dto.RideResponseDTO;
import com.cabapp.backend.entity.Driver;
import com.cabapp.backend.entity.Ride;
import com.cabapp.backend.entity.Ride.RideStatus;
import com.cabapp.backend.entity.User;
import com.cabapp.backend.repository.DriverRepository;
import com.cabapp.backend.repository.RideRepository;
import com.cabapp.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RideService {

    private final RideRepository rideRepository;
    private final UserRepository userRepository;
    private final DriverRepository driverRepository;
    private final SimpMessagingTemplate messagingTemplate;

    // === FARE CALCULATION ===
    // Base fare: ₹30 | Per km: ₹12
    private static final double BASE_FARE = 30.0;
    private static final double RATE_PER_KM = 12.0;
    private static final double EARTH_RADIUS_KM = 6371.0;

    private double calculateDistanceKm(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                        * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_KM * c;
    }

    private double calculateFare(double distanceKm) {
        return BASE_FARE + (distanceKm * RATE_PER_KM);
    }

    // === BOOK RIDE ===
    @Transactional
    public RideResponseDTO bookRide(String riderEmail, RideRequestDTO request) {
        User rider = userRepository.findByEmail(riderEmail)
                .orElseThrow(() -> new RuntimeException("Rider not found"));

        double distance = 1.0; // default fallback
        double fare;
        if (request.getPickupLat() != null && request.getPickupLng() != null
                && request.getDropLat() != null && request.getDropLng() != null) {
            distance = calculateDistanceKm(
                    request.getPickupLat(), request.getPickupLng(),
                    request.getDropLat(), request.getDropLng());
        }
        fare = calculateFare(distance);

        Ride ride = new Ride();
        ride.setRider(rider);
        ride.setPickupLocation(request.getPickupLocation());
        ride.setDropLocation(request.getDropLocation());
        ride.setPickupLat(request.getPickupLat());
        ride.setPickupLng(request.getPickupLng());
        ride.setDropLat(request.getDropLat());
        ride.setDropLng(request.getDropLng());
        ride.setDistanceKm(distance);
        ride.setFare(Math.round(fare * 100.0) / 100.0);
        ride.setStatus(RideStatus.REQUESTED);

        // Try to find nearest available driver
        Driver nearestDriver = findNearestDriver(request.getPickupLat(), request.getPickupLng());
        if (nearestDriver != null) {
            ride.setDriver(nearestDriver);
            ride.setStatus(RideStatus.ACCEPTED);
            ride.setAcceptedAt(LocalDateTime.now());
            nearestDriver.setStatus(Driver.DriverStatus.BUSY);
            driverRepository.save(nearestDriver);
        }

        ride = rideRepository.save(ride);

        RideResponseDTO response = mapToDTO(ride);

        // Notify via WebSocket
        messagingTemplate.convertAndSend("/topic/ride/" + ride.getId(), response);

        return response;
    }

    // === FIND NEAREST DRIVER ===
    private Driver findNearestDriver(Double pickupLat, Double pickupLng) {
        // FIX #8: Use pessimistic write lock so two simultaneous bookRide calls
        // cannot both read the same driver as AVAILABLE and double-assign them.
        List<Driver> availableDrivers = driverRepository.findByStatusWithLock(Driver.DriverStatus.AVAILABLE);
        if (availableDrivers.isEmpty())
            return null;

        if (pickupLat == null || pickupLng == null) {
            return availableDrivers.get(0); // no coords → just pick first
        }

        return availableDrivers.stream()
                .filter(d -> d.getCurrentLat() != null && d.getCurrentLng() != null)
                .min(Comparator.comparingDouble(
                        d -> calculateDistanceKm(pickupLat, pickupLng, d.getCurrentLat(), d.getCurrentLng())))
                .orElse(availableDrivers.get(0)); // fallback: first available
    }

    // === GET RIDE BY ID ===
    public RideResponseDTO getRideById(Long rideId) {
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new RuntimeException("Ride not found: " + rideId));
        return mapToDTO(ride);
    }

    // === CANCEL RIDE ===
    @Transactional
    public RideResponseDTO cancelRide(Long rideId, String riderEmail) {
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new RuntimeException("Ride not found: " + rideId));

        if (!ride.getRider().getEmail().equals(riderEmail)) {
            throw new RuntimeException("You are not authorized to cancel this ride");
        }
        if (ride.getStatus() == RideStatus.IN_PROGRESS || ride.getStatus() == RideStatus.COMPLETED) {
            throw new RuntimeException("Cannot cancel a ride that is in progress or completed");
        }

        ride.setStatus(RideStatus.CANCELLED);

        // Free driver if already assigned
        if (ride.getDriver() != null) {
            Driver driver = ride.getDriver();
            driver.setStatus(Driver.DriverStatus.AVAILABLE);
            driverRepository.save(driver);
        }

        ride = rideRepository.save(ride);
        RideResponseDTO response = mapToDTO(ride);
        messagingTemplate.convertAndSend("/topic/ride/" + ride.getId(), response);
        return response;
    }

    // === RIDE HISTORY (Rider) ===
    public List<RideResponseDTO> getRideHistory(String riderEmail) {
        User rider = userRepository.findByEmail(riderEmail)
                .orElseThrow(() -> new RuntimeException("Rider not found"));
        return rideRepository.findByRiderIdOrderByCreatedAtDesc(rider.getId())
                .stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    // === MAP ENTITY → DTO ===
    public RideResponseDTO mapToDTO(Ride ride) {
        RideResponseDTO dto = new RideResponseDTO();
        dto.setId(ride.getId());
        dto.setPickupLocation(ride.getPickupLocation());
        dto.setDropLocation(ride.getDropLocation());
        dto.setPickupLat(ride.getPickupLat());
        dto.setPickupLng(ride.getPickupLng());
        dto.setDropLat(ride.getDropLat());
        dto.setDropLng(ride.getDropLng());
        dto.setDistanceKm(ride.getDistanceKm());
        dto.setFare(ride.getFare());
        dto.setStatus(ride.getStatus());
        dto.setCreatedAt(ride.getCreatedAt());
        dto.setAcceptedAt(ride.getAcceptedAt());
        dto.setStartedAt(ride.getStartedAt());
        dto.setCompletedAt(ride.getCompletedAt());

        // Rider
        if (ride.getRider() != null) {
            dto.setRiderId(ride.getRider().getId());
            dto.setRiderName(ride.getRider().getUsername());
            dto.setRiderPhone(ride.getRider().getPhone());
        }

        // Driver
        if (ride.getDriver() != null) {
            Driver d = ride.getDriver();
            dto.setDriverId(d.getId());
            dto.setDriverName(d.getUser().getUsername());
            dto.setDriverPhone(d.getUser().getPhone());
            dto.setVehicleNumber(d.getVehicleNumber());
            dto.setVehicleType(d.getVehicleType());
            dto.setDriverLat(d.getCurrentLat());
            dto.setDriverLng(d.getCurrentLng());
            dto.setDriverRating(d.getRating());
        }
        return dto;
    }
}
