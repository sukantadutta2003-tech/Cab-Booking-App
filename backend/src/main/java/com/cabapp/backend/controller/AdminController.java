package com.cabapp.backend.controller;

import com.cabapp.backend.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    // GET /api/admin/stats — Platform-wide statistics
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(adminService.getPlatformStats());
    }

    // GET /api/admin/rides?page=0&size=20 — All rides paginated (newest first)
    @GetMapping("/rides")
    public ResponseEntity<Map<String, Object>> getAllRides(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(adminService.getAllRides(pageable));
    }

    // GET /api/admin/drivers — All drivers with earnings & rating
    @GetMapping("/drivers")
    public ResponseEntity<List<Map<String, Object>>> getAllDrivers() {
        return ResponseEntity.ok(adminService.getAllDrivers());
    }

    // GET /api/admin/users — All registered users
    @GetMapping("/users")
    public ResponseEntity<List<Map<String, Object>>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }
}
