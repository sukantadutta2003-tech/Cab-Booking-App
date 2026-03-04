package com.cabapp.backend.repository;

import com.cabapp.backend.entity.Driver;
import com.cabapp.backend.entity.Driver.DriverStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface DriverRepository extends JpaRepository<Driver, Long> {
    Optional<Driver> findByUserId(Long userId);

    List<Driver> findByStatus(DriverStatus status);

    boolean existsByUserId(Long userId);
}
