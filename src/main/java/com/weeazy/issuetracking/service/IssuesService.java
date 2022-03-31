package com.weeazy.issuetracking.service;

import com.weeazy.issuetracking.dto.IssueDTO;
import com.weeazy.issuetracking.entity.Issues;
import com.weeazy.issuetracking.entity.Status;
import com.weeazy.issuetracking.entity.Type;

import java.util.List;

public interface IssuesService {

    Issues add(IssueDTO issueDTO);
    Issues edit(IssueDTO issueDTO);
    boolean delete(Long id);
    List<Issues> findAll();
    Issues find(Long id);
    List<Issues> findByUser(Long id);
    List<Issues> findByAssigned(Long id);
    List<Type> findAllTypes();
    List<Status> findAllStatus();
    List<Issues> issuesFilter(Long id,int filterId);


}
