package com.cabapp.backend.dto;

import lombok.Data;

@Data
public class RideRequestDTO {

    private String pickupLocation;
    private String dropLocation;

    private Double pickupLat;
    private Double pickupLng;

    private Double dropLat;
    private Double dropLng;
}
