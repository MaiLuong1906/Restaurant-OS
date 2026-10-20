package com.restaurantos.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Value("${server.port:8080}")
    private String serverPort;

    @Bean
    public OpenAPI customOpenAPI() {
        final String securitySchemeName = "bearerAuth";

        return new OpenAPI()
                .info(new Info()
                        .title("Restaurant OS Enterprise API")
                        .version("1.0.0-SNAPSHOT")
                        .description("Tài liệu đặc tả API chuẩn OpenAPI 3 / Swagger cho Hệ điều hành Nhà hàng Restaurant OS Monorepo. " +
                                "Hỗ trợ QR Order, Bếp KDS Realtime, Quầy POS, Quản lý kho nguyên liệu BOM.")
                        .contact(new Contact()
                                .name("Restaurant OS Engineering Team")
                                .email("dev@restaurantos.com")
                                .url("https://github.com/restaurant-os"))
                        .license(new License()
                                .name("MIT License")
                                .url("https://opensource.org/licenses/MIT")))
                .servers(List.of(
                        new Server().url("/").description("Môi trường hiện tại"),
                        new Server().url("http://localhost:8080").description("Môi trường Localhost Development")
                ))
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName,
                                new SecurityScheme()
                                        .name(securitySchemeName)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("Nhập JWT Token theo định dạng: Bearer <token>")));
    }
}
