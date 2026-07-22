// SearchDto.java - 검색 및 페이징 파라미터
package com.example.board.dto;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class SearchDto {
    private int page = 1;             // 현재 페이지
    private int recordSize = 10;      // 페이지당 출력할 데이터 개수
    private String searchType;        // 검색 조건 (title, content, writer)
    private String keyword;           // 검색 키워드

    public int getOffset() {
        return (page - 1) * recordSize;
    }
}