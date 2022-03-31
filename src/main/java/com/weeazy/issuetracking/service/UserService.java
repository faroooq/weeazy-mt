package com.weeazy.issuetracking.service;

import com.weeazy.issuetracking.dto.ChangePasswordDTO;
import com.weeazy.issuetracking.dto.UserDTO;
import com.weeazy.issuetracking.entity.Position;
import com.weeazy.issuetracking.entity.Role;
import com.weeazy.issuetracking.entity.User;

import java.util.List;

public interface UserService {
    User add(UserDTO userDTO);

    User edit(UserDTO userDTO);

    User findByUserName(String userName);

    List<User> find();

    User findById(Long id);

    User delete(Long id);

    List<Role> findRoles();

    List<Position> findPositions();

    void changePassword(ChangePasswordDTO changePasswordDTO);

}
