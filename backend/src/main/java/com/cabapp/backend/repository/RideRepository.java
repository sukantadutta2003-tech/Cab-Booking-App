package com.cabapp.backend.repository;

import com.cabapp.backend.entity.Ride;
import com.cabapp.backend.entity.Ride.RideStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RideRepository extends JpaRepository<Ride, Long> {
    List<Ride> findByRiderIdOrderByCreatedAtDesc(Long riderId);

    List<Ride> findByDriverIdOrderByCreatedAtDesc(Long driverId);

    List<Ride> findByStatus(RideStatus status);

    List<Ride> findByDriverIdAndStatus(Long driverId, RideStatus status);

    // FIX #10: COUNT query — avoids loading all rows into memory just to call .size()
    @Query("SELECT COUNT(r) FROM Ride r WHERE r.status = :status")
    long countByStatus(@Param("status") RideStatus status);
}
