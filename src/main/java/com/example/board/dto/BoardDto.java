package com.example.board.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoardDto {

    private Long boardId;

    private String title;

    private String content;

    private String writer;

    private Integer readCnt;

    private LocalDateTime createdAt;

    // 목록 표시용: 첨부파일 개수
    private Integer fileCount;

    // 상세페이지용: 첨부파일 리스트
    private List<BoardFileDto> fileList;
}
