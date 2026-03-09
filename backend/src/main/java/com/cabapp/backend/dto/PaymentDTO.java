package com.cabapp.backend.dto;

import com.cabapp.backend.entity.Payment.PaymentMethod;
import com.cabapp.backend.entity.Payment.PaymentStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PaymentDTO {

    // -- Request fields --
    private Long rideId;
    private PaymentMethod paymentMethod; // CASH, CARD, UPI

    // -- Response fields --
    private Long id;
    private Double amount;
    private PaymentStatus status;
    private String transactionId;
    private LocalDateTime paidAt;
}
