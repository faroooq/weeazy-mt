package com.weeazy.issuetracking;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class IssueTrackingApplication {

	public static void main(String[] args) {
		SpringApplication.run(IssueTrackingApplication.class, args);
	}

}
