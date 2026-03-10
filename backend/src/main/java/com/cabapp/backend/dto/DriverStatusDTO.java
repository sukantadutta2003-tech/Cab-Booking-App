package com.cabapp.backend.dto;

import com.cabapp.backend.entity.Driver.DriverStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DriverStatusDTO {

    @NotNull(message = "Status is required")
    private DriverStatus status; // AVAILABLE, BUSY, OFFLINE

    // Current GPS position (optional but recommended)
    private Double currentLat;
    private Double currentLng;
}
