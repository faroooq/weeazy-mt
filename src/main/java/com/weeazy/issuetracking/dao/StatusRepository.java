package com.weeazy.issuetracking.dao;

import com.weeazy.issuetracking.entity.Status;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StatusRepository extends JpaRepository<Status,Long> {
}
