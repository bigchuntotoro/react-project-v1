package com.example.board.controller;

import com.example.board.dto.*;
import com.example.board.service.BoardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/boards")
@RequiredArgsConstructor
public class BoardController {

    private final BoardService boardService;

    // 1. 게시글 목록 (페이징 + 검색)
    @GetMapping
    public ResponseEntity<Map<String, Object>> getList(SearchDto searchDto) {
        List<BoardDto> list = boardService.getBoardList(searchDto);
        int totalCount = boardService.getBoardCount(searchDto);

        Map<String, Object> response = new HashMap<>();
        response.put("list", list);
        response.put("totalCount", totalCount);
        response.put("page", searchDto.getPage());
        response.put("recordSize", searchDto.getRecordSize());

        return ResponseEntity.ok(response);
    }

    // 2. 게시글 상세
    @GetMapping("/{id}")
    public ResponseEntity<BoardDto> getDetail(@PathVariable("id") Long id) {
        return ResponseEntity.ok(boardService.getBoardById(id));
    }

    // 3. 게시글 작성 (파일 최대 5개)
    @PostMapping
    public ResponseEntity<String> create(
            @RequestPart("board") BoardDto boardDto,
            @RequestPart(value = "files", required = false) List<MultipartFile> files) {

        if (files != null && files.size() > 5) {
            return ResponseEntity.badRequest().body("첨부파일은 최대 5개까지 가능합니다.");
        }

        boardService.saveBoard(boardDto, files);
        return ResponseEntity.ok("등록 완료");
    }

    // 4. 게시글 수정
    @PutMapping("/{id}")
    public ResponseEntity<String> update(
            @PathVariable("id") Long id,
            @RequestPart("board") BoardDto boardDto,
            @RequestPart(value = "files", required = false) List<MultipartFile> files,
            @RequestParam(value = "deleteFileIds", required = false) List<Long> deleteFileIds) {

        boardDto.setBoardId(id);
        boardService.updateBoard(boardDto, files, deleteFileIds);
        return ResponseEntity.ok("수정 완료");
    }

    // 5. 게시글 삭제
    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable("id") Long id) {
        boardService.deleteBoard(id);
        return ResponseEntity.ok("삭제 완료");
    }
}