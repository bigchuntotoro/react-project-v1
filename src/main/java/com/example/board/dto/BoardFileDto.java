// BoardFileDto.java
package com.example.board.dto;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class BoardFileDto {
    private Long fileId;
    private Long boardId;
    private String originalName;
    private String saveName;
    private long fileSize;
}