package com.cabapp.backend.repository;

import com.cabapp.backend.entity.Payment;
import com.cabapp.backend.entity.Payment.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByRideId(Long rideId);

    // FIX #10: SUM query — avoids loading all payment rows into memory to calculate revenue
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status = :status")
    double sumAmountByStatus(@Param("status") PaymentStatus status);
}
