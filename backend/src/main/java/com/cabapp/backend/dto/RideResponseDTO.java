package com.cabapp.backend.dto;

import com.cabapp.backend.entity.Ride.RideStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class RideResponseDTO {

    private Long id;
    private String pickupLocation;
    private String dropLocation;
    private Double pickupLat;
    private Double pickupLng;
    private Double dropLat;
    private Double dropLng;
    private Double distanceKm;
    private Double fare;
    private RideStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime acceptedAt;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;

    // Rider info
    private Long riderId;
    private String riderName;
    private String riderPhone;

    // Driver info (nullable until assigned)
    private Long driverId;
    private String driverName;
    private String driverPhone;
    private String vehicleNumber;
    private String vehicleType;
    private Double driverLat;
    private Double driverLng;
    private Double driverRating;
}
