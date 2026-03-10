package com.cabapp.backend.service;

import com.cabapp.backend.dto.AuthResponse;
import com.cabapp.backend.dto.LoginRequest;
import com.cabapp.backend.dto.RegisterRequest;
import com.cabapp.backend.entity.Driver;
import com.cabapp.backend.entity.User;
import com.cabapp.backend.entity.User.Role;
import com.cabapp.backend.repository.DriverRepository;
import com.cabapp.backend.repository.UserRepository;
import com.cabapp.backend.security.jwt.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final DriverRepository driverRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered: " + request.getEmail());
        }

        // FIX #6: Validate driver-specific fields when role is DRIVER
        if ("DRIVER".equalsIgnoreCase(request.getRole())) {
            if (request.getVehicleNumber() == null || request.getVehicleNumber().isBlank()) {
                throw new RuntimeException("Vehicle number is required for driver registration");
            }
            if (request.getVehicleType() == null || request.getVehicleType().isBlank()) {
                throw new RuntimeException("Vehicle type is required for driver registration");
            }
            if (request.getLicenseNumber() == null || request.getLicenseNumber().isBlank()) {
                throw new RuntimeException("License number is required for driver registration");
            }
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPhone(request.getPhone());

        String roleStr = request.getRole().toUpperCase();
        user.setRole(Role.valueOf(roleStr));

        user = userRepository.save(user);

        // If driver, create driver profile
        if (request.getRole().equalsIgnoreCase("DRIVER")) {
            Driver driver = new Driver();
            driver.setUser(user);
            driver.setVehicleNumber(request.getVehicleNumber());
            driver.setVehicleType(request.getVehicleType());
            driver.setLicenseNumber(request.getLicenseNumber());
            driver.setStatus(Driver.DriverStatus.OFFLINE);
            driverRepository.save(driver);
        }

        String tokenRole = request.getRole().equalsIgnoreCase("DRIVER") ? "DRIVER" : roleStr;
        String token = jwtService.generateToken(user.getEmail(), tokenRole);

        return new AuthResponse(token, user.getEmail(), user.getUsername(), tokenRole, user.getId());
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        if (!user.isActive()) {
            throw new RuntimeException("Account is suspended");
        }

        // FIX #7: Only override to DRIVER role if the user's actual role is DRIVER.
        // Previously, any user with a driver profile record (e.g. an ADMIN who also
        // had a driver entry) would incorrectly receive a DRIVER token.
        String role;
        if (user.getRole() == Role.DRIVER && driverRepository.existsByUserId(user.getId())) {
            role = "DRIVER";
        } else {
            role = user.getRole().name();
        }

        String token = jwtService.generateToken(user.getEmail(), role);

        return new AuthResponse(token, user.getEmail(), user.getUsername(), role, user.getId());
    }
}
