package com.weeazy.issuetracking.service.impl;

import com.weeazy.issuetracking.dao.PositionRepository;
import com.weeazy.issuetracking.dao.RoleRepository;
import com.weeazy.issuetracking.dao.UserRepository;
import com.weeazy.issuetracking.dto.ChangePasswordDTO;
import com.weeazy.issuetracking.dto.UserDTO;
import com.weeazy.issuetracking.entity.Position;
import com.weeazy.issuetracking.entity.Role;
import com.weeazy.issuetracking.entity.User;
import com.weeazy.issuetracking.exception.IssueTrackingException;
import com.weeazy.issuetracking.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PositionRepository positionRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private BCryptPasswordEncoder bCryptPasswordEncoder;

    @Override
    public User add(UserDTO userDTO) {
        if (userRepository.findByUserName(userDTO.getUserName()) != null) {
            throw new IssueTrackingException("USER NAME IS EXIST");
        }
        if (userRepository.findByEmail(userDTO.getEmail()) != null) {
            throw new IssueTrackingException("EMAIL IS EXIST");
        }

        User user = userDTO.toUser();
        user.setPassword(bCryptPasswordEncoder.encode(user.getPassword()));
        user.setPosition(positionRepository.findById(userDTO.getPositionId()).get());
        user.setRole(roleRepository.findById(userDTO.getRoleId()).get());
        user.setActive(false);
        return userRepository.save(user);
    }

    @Override
    public User edit(UserDTO userDTO) {
        if (userRepository.findByUserNameAndIdNot(userDTO.getUserName(),userDTO.getId()).isPresent()) {
            throw new IssueTrackingException("USER NAME IS EXIST");
        }
        if (userRepository.findByEmailAndIdNot(userDTO.getEmail(),userDTO.getId()).isPresent() ) {
            throw new IssueTrackingException("EMAIL IS EXIST");
        }
        User user = userDTO.toUser();
        user.setPassword(userRepository.findByUserName(userDTO.getUserName()).getPassword());
        user.setPosition(positionRepository.findById(userDTO.getPositionId()).get());
        user.setRole(roleRepository.findById(userDTO.getRoleId()).get());
        user.setActive(userRepository.findByUserName(userDTO.getUserName()).getActive());
        return userRepository.save(user);
    }

    @Override
    public User findByUserName(String userName) {
        User user = null;
        user = userRepository.findByUserName(userName);
        if (user == null) {
            throw new IssueTrackingException("USER_NOT_FOUND");
        } else {
            return user;
        }
    }

    @Override
    public List<User> find() {
        return userRepository.findAll();
    }

    @Override
    public User findById(Long id) {
        return userRepository.findById(id).get();
    }

    @Override
    public User delete(Long id) {
        User user = null;
        if (!userRepository.existsById(id)) {
            throw new IssueTrackingException("USER_NOT_FOUND");
        } else {
            userRepository.deleteById(id);
        }
        return user;
    }

    @Override
    public List<Role> findRoles() {
        return roleRepository.findAll();
    }

    @Override
    public List<Position> findPositions() {
        return positionRepository.findAll();
    }

    @Override
    public void changePassword(ChangePasswordDTO changePasswordDTO) {

        if (!userRepository.existsById(changePasswordDTO.getUserId())) {
            throw new IssueTrackingException("USER_NOT_FOUND");
        }
        User user = userRepository.findById(changePasswordDTO.getUserId()).get();
        if (!changePasswordDTO.getNewPassword().equalsIgnoreCase(changePasswordDTO.getConfirmPassword())){
            throw new IssueTrackingException("NEW_PASSWORD_AND_CONFIRMED_PASSWORD_NOT_SIMILAR");
        }
        if (bCryptPasswordEncoder.matches(changePasswordDTO.getOldPassword(),user.getPassword())){
            user.setPassword(bCryptPasswordEncoder.encode(changePasswordDTO.getNewPassword()));
            userRepository.save(user);
        }else {
            throw new IssueTrackingException("PASSWORD_NOT_MATCH");
        }

    }
}
