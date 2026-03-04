package com.cabapp.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank
    private String username;

    @Email
    @NotBlank
    private String email;

    @NotBlank
    private String password;

    @NotBlank
    private String phone;

    // "RIDER" or "DRIVER"
    @NotBlank
    private String role;

    // Only needed if role is DRIVER
    private String vehicleNumber;
    private String vehicleType;
    private String licenseNumber;
}
