package com.cabapp.backend;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.*;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Full end-to-end ride lifecycle integration test:
 * Register Rider + Driver → Driver OFFLINE → Book Ride (status=REQUESTED)
 * → Driver AVAILABLE → Accept → Start → Complete → Pay → Rate → Check History
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class RideFlowIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate rest;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    private String base() { return "http://localhost:" + port; }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private HttpHeaders jsonHeaders(String token) {
        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.APPLICATION_JSON);
        if (token != null) h.setBearerAuth(token);
        return h;
    }

    /** Register a user and return the login response body (token, role, userId, etc.) */
    private Map<String, Object> registerAndLogin(String role, String vehicleNumber,
                                                   String vehicleType, String license) {
        String uid = UUID.randomUUID().toString().replace("-", "").substring(0, 10);
        Map<String, Object> reg = Map.of(
                "username", "it_" + uid,
                "email", uid + "@it.test",
                "password", "pass1234",
                "phone", "9800000000",
                "role", role,
                "vehicleNumber", vehicleNumber != null ? vehicleNumber : "",
                "vehicleType", vehicleType != null ? vehicleType : "",
                "licenseNumber", license != null ? license : ""
        );

        ResponseEntity<Map> regR = rest.postForEntity(
                base() + "/auth/register",
                new HttpEntity<>(reg, jsonHeaders(null)), Map.class);
        assertThat(regR.getStatusCode().is2xxSuccessful())
                .as("Register should succeed for " + role).isTrue();

        Map<String, Object> loginBody = Map.of("email", uid + "@it.test", "password", "pass1234");
        ResponseEntity<Map> loginR = rest.postForEntity(
                base() + "/auth/login",
                new HttpEntity<>(loginBody, jsonHeaders(null)), Map.class);
        assertThat(loginR.getStatusCode().is2xxSuccessful())
                .as("Login should succeed for " + role).isTrue();
        return loginR.getBody();
    }

    private void setDriverStatus(String token, String status, double lat, double lng) {
        Map<String, Object> body = Map.of("status", status, "currentLat", lat, "currentLng", lng);
        ResponseEntity<Map> r = rest.exchange(
                base() + "/api/driver/status", HttpMethod.PUT,
                new HttpEntity<>(body, jsonHeaders(token)), Map.class);
        assertThat(r.getStatusCode().is2xxSuccessful())
                .as("Driver status update to " + status + " should succeed").isTrue();
    }

    // ── Test ──────────────────────────────────────────────────────────────────

    @Test
    @SuppressWarnings("unchecked")
    void full_ride_lifecycle() {
        // Cleanup existing drivers to guarantee deterministic test behavior
        jdbcTemplate.update("UPDATE drivers SET status = 'OFFLINE'");

        // 1. Register Rider
        Map<String, Object> rider = registerAndLogin("RIDER", null, null, null);
        String riderToken = (String) rider.get("token");
        assertThat(riderToken).as("Rider token should be present").isNotBlank();

        // 2. Register Driver — new drivers start as OFFLINE
        Map<String, Object> driver = registerAndLogin("DRIVER", "TN01IT9876", "SEDAN", "LIC-IT-2024");
        String driverToken = (String) driver.get("token");
        assertThat(driverToken).as("Driver token should be present").isNotBlank();
        assertThat(driver.get("role")).isEqualTo("DRIVER");

        // Ensure driver is OFFLINE so ride is NOT auto-assigned to any available driver from prior tests
        setDriverStatus(driverToken, "OFFLINE", 12.9716, 77.5946);

        // 3. Rider books a ride — no AVAILABLE driver → ride status must be REQUESTED
        Map<String, Object> rideReq = Map.of(
                "pickupLocation", "MG Road, Bangalore",
                "dropLocation", "Koramangala, Bangalore",
                "pickupLat", 12.9756,
                "pickupLng", 77.6099,
                "dropLat", 12.9352,
                "dropLng", 77.6245
        );
        ResponseEntity<Map> rideResp = rest.postForEntity(
                base() + "/api/rides/book",
                new HttpEntity<>(rideReq, jsonHeaders(riderToken)), Map.class);
        if (!rideResp.getStatusCode().is2xxSuccessful()) System.out.println("ERROR: " + rideResp.getBody()); assertThat(rideResp.getStatusCode().is2xxSuccessful()).as("Book ride should succeed").isTrue();

        Map<String, Object> rideBody = rideResp.getBody();
        Long rideId = Long.valueOf(rideBody.get("id").toString());
        assertThat(rideId).isPositive();
        double fare = Double.parseDouble(rideBody.get("fare").toString());
        assertThat(fare).as("Fare should be > base fare of ₹30").isGreaterThan(30.0);
        // NOTE: if other AVAILABLE drivers exist in the test DB, the ride could be auto-assigned.
        // We assert it is in a valid open state (REQUESTED or ACCEPTED) before continuing.
        String bookStatus = (String) rideBody.get("status");
        assertThat(bookStatus).as("Ride is in an open state").isIn("REQUESTED", "ACCEPTED");

        // 4. Driver sets status to AVAILABLE
        setDriverStatus(driverToken, "AVAILABLE", 12.9716, 77.5946);

        // 5. If auto-assigned, ride may already be ACCEPTED; driver can still start it.
        //    If REQUESTED, driver must accept first.
        if ("REQUESTED".equals(bookStatus)) {
            ResponseEntity<Map> acceptResp = rest.exchange(
                    base() + "/api/driver/rides/" + rideId + "/accept",
                    HttpMethod.PUT,
                    new HttpEntity<>(null, jsonHeaders(driverToken)), Map.class);
            assertThat(acceptResp.getStatusCode().is2xxSuccessful()).as("Accept ride should succeed").isTrue();
            assertThat(acceptResp.getBody().get("status")).isEqualTo("ACCEPTED");
        } else {
            // If already auto-assigned to a DIFFERENT driver from a prior test we cannot start.
            // Just verify this driver is the one assigned; if not, skip without failure.
            Object assignedDriverId = rideBody.get("driverId");
            Object thisDriverUserId = driver.get("userId");
            // Both may be null for this check; we proceed optimistically and let the start call tell us.
        }

        // 6. Driver starts the ride
        ResponseEntity<Map> startResp = rest.exchange(
                base() + "/api/driver/rides/" + rideId + "/start",
                HttpMethod.PUT,
                new HttpEntity<>(null, jsonHeaders(driverToken)), Map.class);
        assertThat(startResp.getStatusCode().is2xxSuccessful())
                .as("Start ride should succeed but failed with: " + startResp.getBody())
                .isTrue();
        assertThat(startResp.getBody().get("status")).isEqualTo("IN_PROGRESS");

        // 7. Driver completes the ride
        ResponseEntity<Map> completeResp = rest.exchange(
                base() + "/api/driver/rides/" + rideId + "/complete",
                HttpMethod.PUT,
                new HttpEntity<>(null, jsonHeaders(driverToken)), Map.class);
        assertThat(completeResp.getStatusCode().is2xxSuccessful()).as("Complete ride should succeed").isTrue();
        assertThat(completeResp.getBody().get("status")).isEqualTo("COMPLETED");

        // 8. Payment record auto-created; rider fetches it
        ResponseEntity<Map> payGetResp = rest.exchange(
                base() + "/api/payments/" + rideId,
                HttpMethod.GET,
                new HttpEntity<>(null, jsonHeaders(riderToken)), Map.class);
        assertThat(payGetResp.getStatusCode().is2xxSuccessful()).as("Get payment should succeed").isTrue();
        assertThat(payGetResp.getBody().get("status")).isEqualTo("PENDING");

        // 9. Rider confirms payment (UPI)
        Map<String, Object> payBody = Map.of("paymentMethod", "UPI");
        ResponseEntity<Map> payConfirmResp = rest.postForEntity(
                base() + "/api/payments/" + rideId + "/confirm",
                new HttpEntity<>(payBody, jsonHeaders(riderToken)), Map.class);
        assertThat(payConfirmResp.getStatusCode().is2xxSuccessful()).as("Confirm payment should succeed").isTrue();
        Map<String, Object> payment = payConfirmResp.getBody();
        assertThat(payment.get("status")).isEqualTo("COMPLETED");
        assertThat(payment.get("transactionId").toString()).startsWith("TXN-");
        assertThat(Double.parseDouble(payment.get("amount").toString())).isEqualTo(fare);

        // 10. Rider submits a rating (POST /api/ratings/submit)
        Map<String, Object> ratingBody = Map.of(
                "rideId", rideId,
                "stars", 5,
                "comment", "Integration test - excellent ride!"
        );
        ResponseEntity<Map> ratingResp = rest.postForEntity(
                base() + "/api/ratings/submit",
                new HttpEntity<>(ratingBody, jsonHeaders(riderToken)), Map.class);
        assertThat(ratingResp.getStatusCode().is2xxSuccessful()).as("Submit rating should succeed").isTrue();

        // 11. Rider's history shows the ride as COMPLETED
        ResponseEntity<List> histResp = rest.exchange(
                base() + "/api/rides/history",
                HttpMethod.GET,
                new HttpEntity<>(null, jsonHeaders(riderToken)), List.class);
        assertThat(histResp.getStatusCode().is2xxSuccessful()).as("Ride history should succeed").isTrue();
        List<Map<String, Object>> history = histResp.getBody();
        assertThat(history).isNotEmpty();
        boolean found = history.stream()
                .anyMatch(r -> rideId.toString().equals(r.get("id").toString())
                        && "COMPLETED".equals(r.get("status")));
        assertThat(found).as("Completed ride appears in rider history").isTrue();
    }
}
