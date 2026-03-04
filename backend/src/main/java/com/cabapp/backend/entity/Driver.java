package com.cabapp.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "drivers")
@Data
public class Driver {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String vehicleNumber;

    @Column(nullable = false)
    private String vehicleType; // e.g. SEDAN, SUV, AUTO

    @Column(nullable = false)
    private String licenseNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DriverStatus status = DriverStatus.OFFLINE;

    private double rating = 0.0;

    private int totalRides = 0;

    private double totalEarnings = 0.0;

    // Current location for matching
    private Double currentLat;
    private Double currentLng;

    public enum DriverStatus {
        AVAILABLE, BUSY, OFFLINE
    }
}
