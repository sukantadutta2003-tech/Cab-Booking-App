package com.cabapp.backend.service;

import com.cabapp.backend.entity.Payment.PaymentStatus;
import com.cabapp.backend.entity.Ride.RideStatus;
import com.cabapp.backend.repository.DriverRepository;
import com.cabapp.backend.repository.PaymentRepository;
import com.cabapp.backend.repository.RideRepository;
import com.cabapp.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final DriverRepository driverRepository;
    private final RideRepository rideRepository;
    private final PaymentRepository paymentRepository;
    private final RideService rideService;

    // === PLATFORM STATS ===
    public Map<String, Object> getPlatformStats() {
        long totalUsers   = userRepository.count();
        long totalDrivers = driverRepository.count();
        long totalRides   = rideRepository.count();

        // FIX #10: Use COUNT queries instead of loading all rows and calling .size()
        long requested  = rideRepository.countByStatus(RideStatus.REQUESTED);
        long inProgress = rideRepository.countByStatus(RideStatus.IN_PROGRESS);
        long completed  = rideRepository.countByStatus(RideStatus.COMPLETED);
        long cancelled  = rideRepository.countByStatus(RideStatus.CANCELLED);

        // FIX #10: Use SUM query instead of loading all payments into memory
        double totalRevenue = paymentRepository.sumAmountByStatus(PaymentStatus.COMPLETED);

        return Map.of(
                "totalUsers",    totalUsers,
                "totalDrivers",  totalDrivers,
                "totalRides",    totalRides,
                "rideBreakdown", Map.of(
                        "REQUESTED",   requested,
                        "IN_PROGRESS", inProgress,
                        "COMPLETED",   completed,
                        "CANCELLED",   cancelled
                ),
                "totalRevenue",  Math.round(totalRevenue * 100.0) / 100.0
        );
    }

    // === ALL RIDES (paginated) ===
    public Map<String, Object> getAllRides(Pageable pageable) {
        Page<?> page = rideRepository.findAll(pageable)
                .map(rideService::mapToDTO);
        return Map.of(
                "content",       page.getContent(),
                "totalElements", page.getTotalElements(),
                "totalPages",    page.getTotalPages(),
                "page",          page.getNumber()
        );
    }

    // === ALL DRIVERS ===
    public List<Map<String, Object>> getAllDrivers() {
        return driverRepository.findAll().stream().map(d -> Map.<String, Object>of(
                "id",            d.getId(),
                "name",          d.getUser().getUsername(),
                "email",         d.getUser().getEmail(),
                "phone",         d.getUser().getPhone() != null ? d.getUser().getPhone() : "",
                "vehicleNumber", d.getVehicleNumber(),
                "vehicleType",   d.getVehicleType(),
                "status",        d.getStatus(),
                "rating",        d.getRating(),
                "totalRides",    d.getTotalRides(),
                "totalEarnings", d.getTotalEarnings()
        )).collect(Collectors.toList());
    }

    // === ALL USERS ===
    public List<Map<String, Object>> getAllUsers() {
        return userRepository.findAll().stream().map(u -> Map.<String, Object>of(
                "id",    u.getId(),
                "name",  u.getUsername(),
                "email", u.getEmail(),
                "role",  u.getRole(),
                "phone", u.getPhone() != null ? u.getPhone() : ""
        )).collect(Collectors.toList());
    }
}
