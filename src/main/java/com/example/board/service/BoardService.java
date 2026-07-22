package com.example.board.service;

import com.example.board.dto.BoardDto;
import com.example.board.dto.SearchDto;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface BoardService {

    // 1. 게시글 목록 조회 (페이징/검색)
    List<BoardDto> getBoardList(SearchDto searchDto);

    // 2. 게시글 전체 개수 (페이징용)
    int getBoardCount(SearchDto searchDto);

    // 3. 게시글 상세 조회
    BoardDto getBoardById(Long boardId);

    // 4. 게시글 등록 (파일 저장 포함)
    void saveBoard(BoardDto boardDto, List<MultipartFile> files);

    // 5. 게시글 수정 (파일 추가/삭제 포함)
    void updateBoard(BoardDto boardDto, List<MultipartFile> files, List<Long> deleteFileIds);

    // 6. 게시글 삭제 (관련 파일 삭제 포함)
    void deleteBoard(Long boardId);
}