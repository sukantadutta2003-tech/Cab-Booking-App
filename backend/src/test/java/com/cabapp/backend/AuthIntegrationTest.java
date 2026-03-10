package com.cabapp.backend;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.*;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class AuthIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    private String base() {
        return "http://localhost:" + port;
    }

    private Map<String, Object> registerAndLogin(String role, String vehicleNumber,
                                                  String vehicleType, String license) {
        String unique = UUID.randomUUID().toString().substring(0, 8);
        Map<String, Object> reg = Map.of(
                "username", "test_" + unique,
                "email", unique + "@test.com",
                "password", "test1234",
                "phone", "9000000000",
                "role", role,
                "vehicleNumber", vehicleNumber != null ? vehicleNumber : "",
                "vehicleType", vehicleType != null ? vehicleType : "",
                "licenseNumber", license != null ? license : ""
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        // Register
        ResponseEntity<Map> regResp = restTemplate.postForEntity(
                base() + "/auth/register", new HttpEntity<>(reg, headers), Map.class);
        assertThat(regResp.getStatusCode().is2xxSuccessful())
                .as("Register should succeed").isTrue();

        // Login
        Map<String, Object> login = Map.of("email", unique + "@test.com", "password", "test1234");
        ResponseEntity<Map> loginResp = restTemplate.postForEntity(
                base() + "/auth/login", new HttpEntity<>(login, headers), Map.class);
        assertThat(loginResp.getStatusCode().is2xxSuccessful())
                .as("Login should succeed").isTrue();

        return loginResp.getBody();
    }

    @Test
    void register_rider_and_login_returns_rider_role() {
        Map<String, Object> body = registerAndLogin("RIDER", null, null, null);

        assertThat(body).containsKey("token");
        assertThat(body.get("token").toString()).isNotBlank();
        assertThat(body.get("role")).isEqualTo("RIDER");
        assertThat(body).containsKey("email");
        assertThat(body).containsKey("userId");
    }

    @Test
    void register_driver_and_login_returns_driver_role() {
        Map<String, Object> body = registerAndLogin("DRIVER", "KA01AB1234", "SEDAN", "DL-TEST-001");

        assertThat(body).containsKey("token");
        assertThat(body.get("role")).isEqualTo("DRIVER");
    }

    @Test
    void duplicate_email_registration_returns_error() {
        String email = UUID.randomUUID().toString().substring(0, 8) + "@dup.com";
        Map<String, Object> reg = Map.of(
                "username", "dupUser",
                "email", email,
                "password", "test1234",
                "phone", "9111111111",
                "role", "RIDER",
                "vehicleNumber", "",
                "vehicleType", "",
                "licenseNumber", ""
        );
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> req = new HttpEntity<>(reg, headers);

        ResponseEntity<Map> first = restTemplate.postForEntity(base() + "/auth/register", req, Map.class);
        assertThat(first.getStatusCode().is2xxSuccessful()).isTrue();

        ResponseEntity<Map> second = restTemplate.postForEntity(base() + "/auth/register", req, Map.class);
        assertThat(second.getStatusCode().is2xxSuccessful())
                .as("Duplicate registration should fail").isFalse();
        assertThat(second.getBody()).containsKey("error");
    }
}
