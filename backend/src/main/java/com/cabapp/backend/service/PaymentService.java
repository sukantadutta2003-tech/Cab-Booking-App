package com.cabapp.backend.service;

import com.cabapp.backend.dto.PaymentDTO;
import com.cabapp.backend.entity.Payment;
import com.cabapp.backend.entity.Payment.PaymentMethod;
import com.cabapp.backend.entity.Payment.PaymentStatus;
import com.cabapp.backend.entity.Ride;
import com.cabapp.backend.entity.Ride.RideStatus;
import com.cabapp.backend.repository.PaymentRepository;
import com.cabapp.backend.repository.RideRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final RideRepository rideRepository;

    // === INITIATE PAYMENT (called internally when ride is COMPLETED) ===
    @Transactional
    public Payment initiatePayment(Long rideId) {
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new RuntimeException("Ride not found: " + rideId));

        // FIX #9: Store the Optional result to avoid querying the DB twice
        var existingPayment = paymentRepository.findByRideId(rideId);
        if (existingPayment.isPresent()) {
            return existingPayment.get();
        }

        Payment payment = new Payment();
        payment.setRide(ride);
        payment.setAmount(ride.getFare() != null ? ride.getFare() : 0.0);
        payment.setPaymentMethod(PaymentMethod.CASH); // default; rider can change when confirming
        payment.setStatus(PaymentStatus.PENDING);

        return paymentRepository.save(payment);
    }

    // === CONFIRM PAYMENT (rider pays) ===
    @Transactional
    public PaymentDTO confirmPayment(Long rideId, PaymentMethod method, String requesterEmail) {
        Payment payment = paymentRepository.findByRideId(rideId)
                .orElseThrow(() -> new RuntimeException("No payment record found for ride: " + rideId));

        // Verify the requester is the rider of this ride
        if (!payment.getRide().getRider().getEmail().equals(requesterEmail)) {
            throw new RuntimeException("You are not authorized to confirm this payment");
        }

        if (payment.getStatus() == PaymentStatus.COMPLETED) {
            throw new RuntimeException("Payment already completed for ride: " + rideId);
        }

        // Validate ride is completed
        Ride ride = payment.getRide();
        if (ride.getStatus() != RideStatus.COMPLETED) {
            throw new RuntimeException("Payment can only be confirmed for COMPLETED rides");
        }

        payment.setPaymentMethod(method);
        payment.setStatus(PaymentStatus.COMPLETED);
        payment.setTransactionId("TXN-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase());
        payment.setPaidAt(LocalDateTime.now());

        return mapToDTO(paymentRepository.save(payment));
    }

    // === GET PAYMENT BY RIDE ===
    public PaymentDTO getPaymentByRide(Long rideId) {
        Payment payment = paymentRepository.findByRideId(rideId)
                .orElseThrow(() -> new RuntimeException("No payment record found for ride: " + rideId));
        return mapToDTO(payment);
    }

    // === MAP ENTITY → DTO ===
    public PaymentDTO mapToDTO(Payment payment) {
        PaymentDTO dto = new PaymentDTO();
        dto.setId(payment.getId());
        dto.setRideId(payment.getRide().getId());
        dto.setAmount(payment.getAmount());
        dto.setPaymentMethod(payment.getPaymentMethod());
        dto.setStatus(payment.getStatus());
        dto.setTransactionId(payment.getTransactionId());
        dto.setPaidAt(payment.getPaidAt());
        return dto;
    }
}
