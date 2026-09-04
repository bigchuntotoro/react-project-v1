package com.example.board.util;

import com.example.board.dto.BoardFileDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Component
public class FileUtils {

    // application.properties 설정값
    // 값이 없으면 "프로젝트 실행 디렉토리(user.dir)/upload" 를 사용
    @Value("${file.upload-dir:upload}")
    private String uploadDir;

    /**
     * 업로드 폴더 절대 경로 반환 및 생성
     * ✅ private → public 으로 변경 (컨트롤러에서도 동일 경로를 사용하기 위함)
     */
    public File getAbsoluteUploadDir() {
        File dir = new File(uploadDir);
        if (!dir.isAbsolute()) {
            dir = new File(System.getProperty("user.dir"), uploadDir);
        }
        if (!dir.exists()) {
            dir.mkdirs(); // 디렉토리가 없으면 생성
        }
        return dir;
    }

    /**
     * 다중 파일 업로드 처리
     */
    public List<BoardFileDto> uploadFiles(List<MultipartFile> files, Long boardId) {
        List<BoardFileDto> fileList = new ArrayList<>();

        if (files == null || files.isEmpty()) {
            return fileList;
        }

        for (MultipartFile file : files) {
            if (file != null && !file.isEmpty()) {
                BoardFileDto fileDto = uploadFile(file, boardId);
                if (fileDto != null) {
                    fileList.add(fileDto);
                }
            }
        }

        return fileList;
    }

    /**
     * 단일 파일 업로드 및 BoardFileDto 생성
     */
    public BoardFileDto uploadFile(MultipartFile file, Long boardId) {
        if (file == null || file.isEmpty()) {
            return null;
        }

        String originalName = file.getOriginalFilename();
        String uuid = UUID.randomUUID().toString();

        // 저장될 파일명 (UUID_원본파일명 형태)
        String saveName = uuid + "_" + originalName;

        File uploadDirFile = getAbsoluteUploadDir();
        File dest = new File(uploadDirFile, saveName);

        try {
            file.transferTo(dest.getAbsoluteFile());

            return BoardFileDto.builder()
                    .boardId(boardId)
                    .originalName(originalName)
                    .saveName(saveName)
                    .fileSize(file.getSize())
                    .build();

        } catch (IOException e) {
            log.error("파일 저장 실패: {}", originalName, e);
            throw new RuntimeException("파일 저장 중 오류가 발생했습니다: " + originalName, e);
        }
    }

    /**
     * 단일 파일 삭제 (파일명 기준)
     */
    public void deleteFile(String saveName) {
        if (saveName == null || saveName.isBlank()) {
            return;
        }

        File file = new File(getAbsoluteUploadDir(), saveName);
        if (file.exists()) {
            if (file.delete()) {
                log.info("파일 삭제 성공: {}", saveName);
            } else {
                log.warn("파일 삭제 실패: {}", saveName);
            }
        }
    }

    /**
     * 다중 파일 삭제 (BoardFileDto 리스트 기준)
     */
    public void deleteFiles(List<BoardFileDto> files) {
        if (files == null || files.isEmpty()) {
            return;
        }

        for (BoardFileDto file : files) {
            if (file != null && file.getSaveName() != null) {
                deleteFile(file.getSaveName());
            }
        }
    }
}