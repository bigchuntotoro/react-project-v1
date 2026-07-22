package com.example.board.util;

import com.example.board.dto.BoardFileDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Component
public class FileUtils {

    // application.properties 에 지정된 업로드 경로 (없으면 기본값 C:/upload/)
    @Value("${file.upload-dir:C:/upload/}")
    private String uploadPath;

    /**
     * 단일 파일 업로드
     */
    public BoardFileDto uploadFile(MultipartFile file, Long boardId) {
        if (file == null || file.isEmpty()) {
            return null;
        }

        // 1) 업로드 디렉토리 존재 여부 확인 및 생성
        File dir = new File(uploadPath);
        if (!dir.exists()) {
            dir.mkdirs();
        }

        // 2) 파일명 추출 및 UUID 생성
        String originalName = file.getOriginalFilename();
        String extension = StringUtils.getFilenameExtension(originalName);
        String saveName = UUID.randomUUID().toString() + (extension != null ? "." + extension : "");

        // 3) 디스크에 물리적 파일 저장
        File dest = new File(uploadPath, saveName);
        try {
            file.transferTo(dest);
        } catch (IOException e) {
            log.error("파일 저장 실패: {}", originalName, e);
            throw new RuntimeException("파일 저장 중 오류가 발생했습니다.", e);
        }

        // 4) DB 저장용 DTO 객체 생성 후 반환
        BoardFileDto boardFile = new BoardFileDto();
        boardFile.setBoardId(boardId);
        boardFile.setOriginalName(originalName);
        boardFile.setSaveName(saveName);
        boardFile.setFileSize(file.getSize());

        return boardFile;
    }

    /**
     * 다중 파일 업로드
     */
    public List<BoardFileDto> uploadFiles(List<MultipartFile> files, Long boardId) {
        List<BoardFileDto> fileList = new ArrayList<>();
        if (files == null || files.isEmpty()) {
            return fileList;
        }

        for (MultipartFile file : files) {
            if (!file.isEmpty()) {
                BoardFileDto boardFile = uploadFile(file, boardId);
                if (boardFile != null) {
                    fileList.add(boardFile);
                }
            }
        }
        return fileList;
    }

    /**
     * 저장된 실제 파일 물리적 삭제
     */
    public void deleteFile(String saveName) {
        if (!StringUtils.hasText(saveName)) {
            return;
        }

        File file = Paths.get(uploadPath, saveName).toFile();
        if (file.exists()) {
            if (file.delete()) {
                log.info("파일 삭제 완료: {}", saveName);
            } else {
                log.warn("파일 삭제 실패: {}", saveName);
            }
        }
    }

    /**
     * 다중 파일 물리적 삭제
     */
    public void deleteFiles(List<BoardFileDto> fileList) {
        if (fileList == null || fileList.isEmpty()) {
            return;
        }

        for (BoardFileDto file : fileList) {
            deleteFile(file.getSaveName());
        }
    }
}