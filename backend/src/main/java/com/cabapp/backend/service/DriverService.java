package com.cabapp.backend.service;

import com.cabapp.backend.dto.DriverStatusDTO;
import com.cabapp.backend.dto.RideResponseDTO;
import com.cabapp.backend.entity.Driver;
import com.cabapp.backend.entity.Driver.DriverStatus;
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
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DriverService {

    private final DriverRepository driverRepository;
    private final RideRepository rideRepository;
    private final UserRepository userRepository;
    private final RideService rideService;
    private final PaymentService paymentService;
    private final SimpMessagingTemplate messagingTemplate;

    // === GET DRIVER ENTITY BY EMAIL ===
    private Driver getDriverByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return driverRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Driver profile not found"));
    }

    // === PENDING RIDES (waiting for a driver) ===
    public List<RideResponseDTO> getPendingRides(String driverEmail) {
        return rideRepository.findByStatus(RideStatus.REQUESTED)
                .stream().map(rideService::mapToDTO).collect(Collectors.toList());
    }

    // === ACCEPT RIDE ===
    @Transactional
    public RideResponseDTO acceptRide(Long rideId, String driverEmail) {
        Driver driver = getDriverByEmail(driverEmail);

        // FIX #8: Use pessimistic write lock so two simultaneous acceptRide calls
        // cannot both read the same ride as REQUESTED and double-assign it.
        Ride ride = rideRepository.findByIdWithLock(rideId)
                .orElseThrow(() -> new RuntimeException("Ride not found: " + rideId));

        if (ride.getStatus() != RideStatus.REQUESTED) {
            throw new RuntimeException("Ride is no longer available (status: " + ride.getStatus() + ")");
        }
        if (driver.getStatus() == DriverStatus.BUSY) {
            throw new RuntimeException("You already have an active ride");
        }

        ride.setDriver(driver);
        ride.setStatus(RideStatus.ACCEPTED);
        ride.setAcceptedAt(LocalDateTime.now());

        driver.setStatus(DriverStatus.BUSY);
        driverRepository.save(driver);

        ride = rideRepository.save(ride);
        RideResponseDTO response = rideService.mapToDTO(ride);
        messagingTemplate.convertAndSend("/topic/ride/" + ride.getId(), response);
        messagingTemplate.convertAndSend("/topic/rides/new", response);
        return response;
    }

    // === REJECT RIDE ===
    @Transactional
    public RideResponseDTO rejectRide(Long rideId, String driverEmail) {
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new RuntimeException("Ride not found: " + rideId));

        // If this driver was auto-assigned, unassign and set back to REQUESTED
        Driver driver = getDriverByEmail(driverEmail);
        if (ride.getDriver() != null && ride.getDriver().getId().equals(driver.getId())) {
            ride.setDriver(null);
            ride.setStatus(RideStatus.REQUESTED);
            ride.setAcceptedAt(null);
            driver.setStatus(DriverStatus.AVAILABLE);
            driverRepository.save(driver);
        }

        ride = rideRepository.save(ride);
        RideResponseDTO response = rideService.mapToDTO(ride);
        messagingTemplate.convertAndSend("/topic/ride/" + ride.getId(), response);
        messagingTemplate.convertAndSend("/topic/rides/new", response);
        return response;
    }

    // === START RIDE (driver picks up rider) ===
    @Transactional
    public RideResponseDTO startRide(Long rideId, String driverEmail) {
        Driver driver = getDriverByEmail(driverEmail);
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new RuntimeException("Ride not found: " + rideId));

        // FIX #5: Null check before accessing ride.getDriver() to prevent NPE
        if (ride.getDriver() == null || !ride.getDriver().getId().equals(driver.getId())) {
            throw new RuntimeException("This ride is not assigned to you");
        }
        if (ride.getStatus() != RideStatus.ACCEPTED) {
            throw new RuntimeException("Ride must be ACCEPTED before starting");
        }

        ride.setStatus(RideStatus.IN_PROGRESS);
        ride.setStartedAt(LocalDateTime.now());
        ride = rideRepository.save(ride);

        RideResponseDTO response = rideService.mapToDTO(ride);
        messagingTemplate.convertAndSend("/topic/ride/" + ride.getId(), response);
        return response;
    }

    // === COMPLETE RIDE ===
    @Transactional
    public RideResponseDTO completeRide(Long rideId, String driverEmail) {
        Driver driver = getDriverByEmail(driverEmail);
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new RuntimeException("Ride not found: " + rideId));

        // FIX #5: Null check before accessing ride.getDriver() to prevent NPE
        if (ride.getDriver() == null || !ride.getDriver().getId().equals(driver.getId())) {
            throw new RuntimeException("This ride is not assigned to you");
        }
        if (ride.getStatus() != RideStatus.IN_PROGRESS) {
            throw new RuntimeException("Ride must be IN_PROGRESS to complete");
        }

        ride.setStatus(RideStatus.COMPLETED);
        ride.setCompletedAt(LocalDateTime.now());

        driver.setStatus(DriverStatus.AVAILABLE);
        driver.setTotalRides(driver.getTotalRides() + 1);
        driver.setTotalEarnings(driver.getTotalEarnings() + (ride.getFare() != null ? ride.getFare() : 0.0));
        driverRepository.save(driver);

        ride = rideRepository.save(ride);

        // Auto-create a PENDING payment record for the completed ride
        paymentService.initiatePayment(ride.getId());

        RideResponseDTO response = rideService.mapToDTO(ride);
        messagingTemplate.convertAndSend("/topic/ride/" + ride.getId(), response);
        return response;
    }

    // === UPDATE DRIVER STATUS & LOCATION ===
    @Transactional
    public Map<String, Object> updateStatus(String driverEmail, DriverStatusDTO dto) {
        Driver driver = getDriverByEmail(driverEmail);
        driver.setStatus(dto.getStatus());
        if (dto.getCurrentLat() != null)
            driver.setCurrentLat(dto.getCurrentLat());
        if (dto.getCurrentLng() != null)
            driver.setCurrentLng(dto.getCurrentLng());
        driverRepository.save(driver);
        return Map.of(
                "status", driver.getStatus(),
                "message", "Driver status updated successfully");
    }

    // === EARNINGS SUMMARY ===
    public Map<String, Object> getEarnings(String driverEmail) {
        Driver driver = getDriverByEmail(driverEmail);
        return Map.of(
                "totalEarnings", driver.getTotalEarnings(),
                "totalRides", driver.getTotalRides(),
                "rating", driver.getRating(),
                "completedRideCount", driver.getTotalRides(),
                "status", driver.getStatus());
    }

    // === MY RIDES (driver's full history) ===
    public List<RideResponseDTO> getMyRides(String driverEmail) {
        Driver driver = getDriverByEmail(driverEmail);
        return rideRepository.findByDriverIdOrderByCreatedAtDesc(driver.getId())
                .stream().map(rideService::mapToDTO).collect(Collectors.toList());
    }
}
