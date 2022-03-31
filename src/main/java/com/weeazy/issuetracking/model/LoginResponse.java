package com.weeazy.issuetracking.model;

import com.weeazy.issuetracking.entity.User;
import lombok.*;

@AllArgsConstructor
@Data
@ToString
@EqualsAndHashCode
public class LoginResponse  {
    private User user;
    private JwtResponse jwtResponse;
}
