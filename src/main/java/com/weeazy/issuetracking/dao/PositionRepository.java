package com.weeazy.issuetracking.dao;

import com.weeazy.issuetracking.entity.Position;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PositionRepository extends JpaRepository<Position,Long> {
}
