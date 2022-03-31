package com.weeazy.issuetracking.dao;

import com.weeazy.issuetracking.entity.Type;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TypeRepository extends JpaRepository<Type,Long> {
}
