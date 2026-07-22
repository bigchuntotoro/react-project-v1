package com.example.board.controller;

import com.example.board.dto.*;
import com.example.board.service.BoardService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
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

    // application.properties의 file.upload-dir 값 활용 (기본값: C:/upload/)
    @Value("${file.upload-dir:C:/upload/}")
    private String uploadPath;

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
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> create(
            @RequestPart("board") BoardDto boardDto,
            @RequestPart(value = "files", required = false) List<MultipartFile> files) {

        if (files != null && files.size() > 5) {
            return ResponseEntity.badRequest().body("첨부파일은 최대 5개까지 등록할 수 있습니다.");
        }

        boardService.saveBoard(boardDto, files);
        return ResponseEntity.ok("등록 완료");
    }

    // 4. 게시글 수정
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
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

    // 6. 첨부파일 다운로드 & 이미지 inline 스트리밍 (✨ 필수 추가)
    @GetMapping("/download/{fileId}")
    public ResponseEntity<Resource> downloadFile(
            @PathVariable("fileId") Long fileId,
            @RequestParam(value = "inline", defaultValue = "false") boolean inline) {

        BoardFileDto fileDto = boardService.getFileById(fileId);
        if (fileDto == null) {
            return ResponseEntity.notFound().build();
        }

        try {
            // 저장된 파일 경로 매핑
            Path filePath = Paths.get(uploadPath).resolve(fileDto.getSaveName()).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            // 파일의 확장자에 따른 MediaType 감지 (image/png, image/jpeg 등)
            MediaType mediaType = MediaTypeFactory
                    .getMediaType(fileDto.getOriginalName())
                    .orElse(MediaType.APPLICATION_OCTET_STREAM);

            // 파일명 인코딩 (한글 파일명 깨짐 예방)
            String encodedOriginalName = UriUtils.encode(fileDto.getOriginalName(), StandardCharsets.UTF_8);

            // inline=true면 브라우저 표시, false면 일반 다운로드
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