package com.weeazy.issuetracking.model;

import lombok.*;

import java.io.Serializable;

@RequiredArgsConstructor
@AllArgsConstructor
@Data
@ToString
@EqualsAndHashCode
@Builder
public class ResponseMessage implements Serializable {
    private static final long serialVersionUID = 1L;

    private boolean isSuccess;
    private Object response;
    private String errMsg;
    private String errDetail;
    private String successMsg;

    private static ResponseMessage responseMessage = null;

    public static ResponseMessage getInstance() {
        if (responseMessage == null) {
            responseMessage = new ResponseMessage();
        }
        responseMessage.setResponse(null);
        responseMessage.setErrMsg(null);
        responseMessage.setErrDetail(null);
        responseMessage.setSuccessMsg(null);

        return responseMessage;
    }

    @Override
    public String toString() {
        return "ResponseMessage{" +
                "isSuccess=" + isSuccess +
                ", response=" + response +
                ", errMsg='" + errMsg + '\'' +
                ", errDetail='" + errDetail + '\'' +
                ", successMsg='" + successMsg + '\'' +
                '}';
    }
}
