package com.example.board.service;

import com.example.board.dto.BoardDto;
import com.example.board.dto.BoardFileDto;
import com.example.board.dto.SearchDto;
import com.example.board.mapper.BoardMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoardServiceImpl implements BoardService {

    private final BoardMapper boardMapper;
    // private final FileUtils fileUtils; // 파일 물리 저장 및 BoardFileDto 변환 유틸

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
        // 1) 조회수 증가 (Mapper의 updateReadCount 메서드 사용)
        boardMapper.updateReadCount(boardId);

        // 2) 게시글 상세 정보 조회
        BoardDto board = boardMapper.selectBoardById(boardId);

        // 3) 첨부파일 목록 조회 후 세팅 (BoardDto 내에 fileList가 있는 경우)
        if (board != null) {
            List<BoardFileDto> fileList = boardMapper.selectFilesByBoardId(boardId);
            board.setFileList(fileList);
        }

        return board;
    }

    /**
     * 4. 게시글 등록 (파일 저장 포함)
     */
    @Override
    @Transactional
    public void saveBoard(BoardDto boardDto, List<MultipartFile> files) {
        // 1) 게시글 본문 DB 저장 (useGeneratedKeys로 boardDto에 boardId 자동 채움)
        boardMapper.insertBoard(boardDto);

        // 2) 첨부파일 업로드 및 DB 저장
        if (files != null && !files.isEmpty()) {
            List<BoardFileDto> fileList = new ArrayList<>();

            for (MultipartFile file : files) {
                if (!file.isEmpty()) {
                    // TODO: FileUtils를 사용하여 실제 디스크에 저장 후 BoardFileDto 객체 생성
                    // BoardFileDto boardFile = fileUtils.uploadFile(file, boardDto.getBoardId());
                    // fileList.add(boardFile);
                }
            }

            // 업로드할 파일이 존재하는 경우 일괄 Insert (insertBoardFiles)
            if (!fileList.isEmpty()) {
                boardMapper.insertBoardFiles(fileList);
            }
        }
    }

    /**
     * 5. 게시글 수정 (파일 추가/삭제 포함)
     */
    @Override
    @Transactional
    public void updateBoard(BoardDto boardDto, List<MultipartFile> files, List<Long> deleteFileIds) {
        // 1) 게시글 본문 수정
        boardMapper.updateBoard(boardDto);

        // 2) 삭제 요청된 파일 삭제 (deleteFilesByIds)
        if (deleteFileIds != null && !deleteFileIds.isEmpty()) {
            // TODO: 필요한 경우 DB 삭제 전 디스크의 실제 파일 삭제 로직 추가
            boardMapper.deleteFilesByIds(deleteFileIds);
        }

        // 3) 새로 추가된 파일 업로드 및 DB 저장
        if (files != null && !files.isEmpty()) {
            List<BoardFileDto> newFileList = new ArrayList<>();

            for (MultipartFile file : files) {
                if (!file.isEmpty()) {
                    // TODO: FileUtils를 사용하여 실제 디스크 저장 후 BoardFileDto 생성
                    // BoardFileDto boardFile = fileUtils.uploadFile(file, boardDto.getBoardId());
                    // newFileList.add(boardFile);
                }
            }

            if (!newFileList.isEmpty()) {
                boardMapper.insertBoardFiles(newFileList);
            }
        }
    }

    /**
     * 6. 게시글 삭제 (관련 파일 삭제 포함)
     */
    @Override
    @Transactional
    public void deleteBoard(Long boardId) {
        // 1) 관련 첨부파일 목록 조회 후 실제 디스크 파일 삭제 (필요시)
        /*
        List<BoardFileDto> files = boardMapper.selectFilesByBoardId(boardId);
        for (BoardFileDto file : files) {
            fileUtils.deleteFile(file.getSavedPath());
        }
        */

        // 2) 게시글 삭제 (DB에서 외래키 ON DELETE CASCADE 설정이 되어 있다면 파일 레코드도 자동 삭제됨)
        boardMapper.deleteBoard(boardId);
    }
}