package com.example.board.service;

import com.example.board.dto.BoardDto;
import com.example.board.dto.BoardFileDto;
import com.example.board.dto.SearchDto;
import com.example.board.mapper.BoardMapper;
import com.example.board.util.FileUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoardServiceImpl implements BoardService {

    private final BoardMapper boardMapper;
    private final FileUtils fileUtils; // 👈 FileUtils 주입 완료

    /**
     * 1. 게시글 목록 조회 (페이징/검색)
     */
    @Override
    public List<BoardDto> getBoardList(SearchDto searchDto) {
        return boardMapper.selectBoardList(searchDto);
    }

    /**
     * 2. 게시글 전체 개수 (페이징용)
     */
    @Override
    public int getBoardCount(SearchDto searchDto) {
        return boardMapper.selectBoardCount(searchDto);
    }

    /**
     * 3. 게시글 상세 조회
     */
    @Override
    @Transactional
    public BoardDto getBoardById(Long boardId) {
        // 1) 조회수 증가
        boardMapper.updateReadCount(boardId);

        // 2) 게시글 상세 정보 조회
        BoardDto board = boardMapper.selectBoardById(boardId);

        // 3) 첨부파일 목록 조회 후 세팅
        if (board != null) {
            List<BoardFileDto> fileList = boardMapper.selectFilesByBoardId(boardId);
            board.setFileList(fileList);
        }

        return board;
    }

    /**
     * 4. 게시글 등록 (파일 물리 저장 + DB 저장)
     */
    @Override
    @Transactional
    public void saveBoard(BoardDto boardDto, List<MultipartFile> files) {
        // 1) 게시글 본문 DB 저장 (useGeneratedKeys로 boardDto.boardId 자동 세팅)
        boardMapper.insertBoard(boardDto);

        // 2) 첨부파일 디스크 저장 및 DB Bulk Insert
        if (files != null && !files.isEmpty()) {
            List<BoardFileDto> fileList = fileUtils.uploadFiles(files, boardDto.getBoardId());

            if (!fileList.isEmpty()) {
                boardMapper.insertBoardFiles(fileList);
            }
        }
    }

    /**
     * 5. 게시글 수정 (파일 선택적 추가/삭제 포함)
     */
    @Override
    @Transactional
    public void updateBoard(BoardDto boardDto, List<MultipartFile> files, List<Long> deleteFileIds) {
        // 1) 게시글 본문 수정
        boardMapper.updateBoard(boardDto);

        // 2) 삭제 요청된 파일 삭제 (디스크 물리 삭제 + DB 레코드 삭제)
        if (deleteFileIds != null && !deleteFileIds.isEmpty()) {
            // DB 전체 파일 목록 중 삭제 대상 필터링 후 디스크 파일 삭제
            List<BoardFileDto> currentFiles = boardMapper.selectFilesByBoardId(boardDto.getBoardId());
            for (BoardFileDto file : currentFiles) {
                if (deleteFileIds.contains(file.getFileId())) {
                    fileUtils.deleteFile(file.getSaveName());
                }
            }
            // DB 테이블 레코드 삭제
            boardMapper.deleteFilesByIds(deleteFileIds);
        }

        // 3) 새로 추가된 파일 업로드 및 DB 저장
        if (files != null && !files.isEmpty()) {
            List<BoardFileDto> newFileList = fileUtils.uploadFiles(files, boardDto.getBoardId());

            if (!newFileList.isEmpty()) {
                boardMapper.insertBoardFiles(newFileList);
            }
        }
    }

    /**
     * 6. 게시글 삭제 (관련 첨부파일 전체 삭제 포함)
     */
    @Override
    @Transactional
    public void deleteBoard(Long boardId) {
        // 1) 게시글에 속한 첨부파일 디스크에서 물리적 삭제
        List<BoardFileDto> files = boardMapper.selectFilesByBoardId(boardId);
        fileUtils.deleteFiles(files);

        // 2) 게시글 DB 삭제 (Cascade 설정 시 reactboard_file 의 파일 데이터도 함께 삭제됨)
        boardMapper.deleteBoard(boardId);
    }
}