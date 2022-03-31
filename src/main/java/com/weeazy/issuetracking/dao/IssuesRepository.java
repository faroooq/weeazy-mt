package com.weeazy.issuetracking.dao;

import com.weeazy.issuetracking.entity.Issues;
import com.weeazy.issuetracking.entity.Status;
import com.weeazy.issuetracking.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IssuesRepository extends JpaRepository<Issues, Long> {
    void deleteById(Issues issues);
    List<Issues> findByUser(User user);
    List<Issues> findByAssignTo(User user);
    List<Issues> findByAssignToAndStatus(User user, Status status);

}
