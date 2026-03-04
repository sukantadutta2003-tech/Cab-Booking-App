package com.cabapp.backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:postgresql://localhost:5432/cabapp",
        "spring.datasource.username=postgres",
        "spring.datasource.password=sd2003"
})
class CabBookingApplicationTests {

    @Test
    void contextLoads() {
    }
}
