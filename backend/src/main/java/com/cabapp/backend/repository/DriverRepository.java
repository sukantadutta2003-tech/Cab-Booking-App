package com.cabapp.backend.repository;

import com.cabapp.backend.entity.Driver;
import com.cabapp.backend.entity.Driver.DriverStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface DriverRepository extends JpaRepository<Driver, Long> {
    Optional<Driver> findByUserId(Long userId);

    boolean existsByUserId(Long userId);

    List<Driver> findByStatus(DriverStatus status);

    // FIX #8: Pessimistic write lock prevents two simultaneous bookings
    // from assigning the same AVAILABLE driver to different rides.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT d FROM Driver d WHERE d.status = :status")
    List<Driver> findByStatusWithLock(DriverStatus status);
}
