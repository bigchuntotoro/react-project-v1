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
    // 👇 목록 표시용: 첨부파일 개수 (이 부분이 들어가야 리액트 hasAttachment에서 인식합니다)
    private int fileCount;

    // 상세페이지용: 첨부파일 리스트
    private List<BoardFileDto> fileList;
}