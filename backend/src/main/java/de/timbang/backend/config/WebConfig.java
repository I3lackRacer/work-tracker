package de.timbang.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        // Forward all routes except /api/** to index.html
        registry.addViewController("/**/{path:[^\\.]*}")
            .setViewName("forward:/index.html");
    }
} 