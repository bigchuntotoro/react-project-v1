// BoardDto.java
package com.example.board.dto;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter
public class BoardDto {
    private Long boardId;
    private String title;
    private String content;
    private String writer;
    private int readCnt;
    private LocalDateTime createdAt;
    private List<BoardFileDto> fileList;
}