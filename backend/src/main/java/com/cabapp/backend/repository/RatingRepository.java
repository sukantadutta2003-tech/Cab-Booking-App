package com.cabapp.backend.repository;

import com.cabapp.backend.entity.Rating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface RatingRepository extends JpaRepository<Rating, Long> {
    List<Rating> findByDriverId(Long driverId);

    Optional<Rating> findByRideId(Long rideId);

    @Query("SELECT AVG(r.stars) FROM Rating r WHERE r.driver.id = :driverId")
    Double findAverageRatingByDriverId(Long driverId);
}
