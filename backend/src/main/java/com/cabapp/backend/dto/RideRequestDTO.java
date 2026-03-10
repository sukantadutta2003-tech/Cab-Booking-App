package com.cabapp.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RideRequestDTO {

    @NotBlank(message = "Pickup location is required")
    private String pickupLocation;
    
    @NotBlank(message = "Drop location is required")
    private String dropLocation;

    private Double pickupLat;
    private Double pickupLng;

    private Double dropLat;
    private Double dropLng;
}
