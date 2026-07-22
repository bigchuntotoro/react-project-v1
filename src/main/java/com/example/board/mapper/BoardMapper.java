package com.example.board.mapper;

import com.example.board.dto.BoardDto;
import com.example.board.dto.BoardFileDto;
import com.example.board.dto.SearchDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface BoardMapper {

    // 1. 게시글 목록 조회 (페이징 + 검색)
    List<BoardDto> selectBoardList(SearchDto searchDto);

    // 2. 게시글 총 개수 (페이징용)
    int selectBoardCount(SearchDto searchDto);

    // 3. 게시글 상세 조회
    BoardDto selectBoardById(Long boardId);

    // 4. 첨부파일 목록 조회
    List<BoardFileDto> selectFilesByBoardId(Long boardId);

    // 5. 게시글 등록
    int insertBoard(BoardDto boardDto);

    // 6. 파일 정보 다중 등록
    int insertBoardFiles(List<BoardFileDto> fileList);

    // 7. 게시글 수정
    int updateBoard(BoardDto boardDto);

    // 8. 조회수 1 증가
    int updateReadCount(Long boardId);

    // 9. 게시글 삭제
    int deleteBoard(Long boardId);

    // 10. 특정 파일 ID 목록 삭제
    int deleteFilesByIds(@Param("list") List<Long> deleteFileIds);
}