package com.cabapp.backend.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class RatingDTO {

    // -- Request fields --
    private Long rideId;
    private int stars;       // 1 to 5
    private String comment;

    // -- Response fields --
    private Long id;
    private String driverName;
    private Double driverAverageRating;
    private LocalDateTime createdAt;
}
