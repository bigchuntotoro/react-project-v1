package com.example.board.controller;

import com.example.board.dto.*;
import com.example.board.service.BoardService;
import com.example.board.util.FileUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.util.UriUtils;

import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/boards")
@RequiredArgsConstructor
public class BoardController {

    private final BoardService boardService;
    private final FileUtils fileUtils;   // ✅ 추가: FileUtils 주입

    // =========================================================
    // 1. 게시글 목록
    // =========================================================
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


    // =========================================================
    // 2. 게시글 상세
    // =========================================================
    @GetMapping("/{id}")
    public ResponseEntity<BoardDto> getDetail(
            @PathVariable("id") Long id) {

        BoardDto board = boardService.getBoardById(id);

        if (board == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(board);
    }


    // =========================================================
    // 3. 게시글 작성
    // =========================================================
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> create(
            @RequestPart("board") BoardDto boardDto,
            @RequestPart(value = "files", required = false)
            List<MultipartFile> files,
            Authentication authentication) {

        // -----------------------------------------------------
        // 인증 확인
        // -----------------------------------------------------
        if (authentication == null ||
                !authentication.isAuthenticated()) {

            Map<String, Object> response = new HashMap<>();
            response.put("message", "로그인이 필요한 서비스입니다.");

            return ResponseEntity.status(401).body(response);
        }


        // -----------------------------------------------------
        // 첨부파일 개수 확인
        // -----------------------------------------------------
        if (files != null && files.size() > 5) {

            Map<String, Object> response = new HashMap<>();
            response.put(
                    "message",
                    "첨부파일은 최대 5개까지 등록할 수 있습니다."
            );

            return ResponseEntity.badRequest().body(response);
        }


        // -----------------------------------------------------
        // JWT에서 사용자 정보 가져오기
        // authentication.getName()
        // = JwtTokenProvider에서 설정한 subject
        // -----------------------------------------------------
        String currentUsername = authentication.getName();

        boardDto.setWriter(currentUsername);


        // -----------------------------------------------------
        // 게시글 저장
        // -----------------------------------------------------
        boardService.saveBoard(boardDto, files);


        // -----------------------------------------------------
        // 등록 결과 반환
        // boardDto.boardId는 INSERT 후 MyBatis
        // useGeneratedKeys/keyProperty 설정에 따라 채워짐
        // -----------------------------------------------------
        Map<String, Object> response = new HashMap<>();

        response.put("message", "등록 완료");
        response.put("boardId", boardDto.getBoardId());

        return ResponseEntity.ok(response);
    }


    // =========================================================
    // 4. 게시글 수정
    // =========================================================
    @PutMapping(
            value = "/{id}",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<String> update(
            @PathVariable("id") Long id,
            @RequestPart("board") BoardDto boardDto,
            @RequestPart(value = "files", required = false)
            List<MultipartFile> files,
            @RequestParam(
                    value = "deleteFileIds",
                    required = false
            )
            List<Long> deleteFileIds) {

        boardDto.setBoardId(id);

        boardService.updateBoard(
                boardDto,
                files,
                deleteFileIds
        );

        return ResponseEntity.ok("수정 완료");
    }


    // =========================================================
    // 5. 게시글 삭제
    // =========================================================
    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(
            @PathVariable("id") Long id) {

        boardService.deleteBoard(id);

        return ResponseEntity.ok("삭제 완료");
    }


    // =========================================================
    // 6. 첨부파일 다운로드 / 이미지 inline
    // =========================================================
    @GetMapping("/download/{fileId}")
    public ResponseEntity<Resource> downloadFile(
            @PathVariable("fileId") Long fileId,
            @RequestParam(value = "inline", defaultValue = "false") boolean inline) {

        BoardFileDto fileDto = boardService.getFileById(fileId);

        if (fileDto == null) {
            return ResponseEntity.notFound().build();
        }

        try {
            // ✅ FileUtils와 동일한 경로 계산 로직 사용 (경로 불일치 원천 차단)
            Path filePath = fileUtils.getAbsoluteUploadDir()
                    .toPath()
                    .resolve(fileDto.getSaveName())
                    .normalize();

            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            MediaType mediaType = MediaTypeFactory
                    .getMediaType(fileDto.getOriginalName())
                    .orElse(MediaType.APPLICATION_OCTET_STREAM);

            String encodedOriginalName = UriUtils.encode(
                    fileDto.getOriginalName(), StandardCharsets.UTF_8);

            String dispositionType = inline ? "inline" : "attachment";
            String contentDisposition = dispositionType + "; filename=\"" + encodedOriginalName + "\"";

            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition)
                    .body(resource);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}