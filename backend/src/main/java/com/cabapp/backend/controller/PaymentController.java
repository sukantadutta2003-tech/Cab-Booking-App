package com.cabapp.backend.controller;

import com.cabapp.backend.dto.PaymentDTO;
import com.cabapp.backend.entity.Payment.PaymentMethod;
import com.cabapp.backend.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    // GET /api/payments/{rideId} — Get payment details for a ride
    @GetMapping("/{rideId}")
    public ResponseEntity<PaymentDTO> getPayment(@PathVariable Long rideId) {
        return ResponseEntity.ok(paymentService.getPaymentByRide(rideId));
    }

    // POST /api/payments/{rideId}/confirm — Rider confirms and pays
    @PostMapping("/{rideId}/confirm")
    public ResponseEntity<PaymentDTO> confirmPayment(
            @PathVariable Long rideId,
            @RequestBody PaymentDTO request,
            Authentication auth) {
        PaymentMethod method = request.getPaymentMethod() != null
                ? request.getPaymentMethod()
                : PaymentMethod.CASH;
        return ResponseEntity.ok(paymentService.confirmPayment(rideId, method));
    }
}
