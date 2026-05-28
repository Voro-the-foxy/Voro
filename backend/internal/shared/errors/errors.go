package errors

import (
	"fmt"
	"net/http"
)

type AppError struct {
	Code    int
	Message string
}

var (
	ErrNotFound           = &AppError{Code: http.StatusNotFound, Message: "해당 리소스를 찾을 수 없습니다"}
	ErrInvalidRequest     = &AppError{Code: http.StatusBadRequest, Message: "잘못된 요청입니다"}
	ErrUnauthorized       = &AppError{Code: http.StatusUnauthorized, Message: "권한이 없습니다"}
	ErrInternalServer     = &AppError{Code: http.StatusInternalServerError, Message: "서버 내부 오류가 발생했습니다"}
	ErrInvalidCredentials = &AppError{Code: http.StatusUnauthorized, Message: "이메일 또는 비밀번호가 올바르지 않습니다"}
	ErrInvalidToken       = &AppError{Code: http.StatusUnauthorized, Message: "유효하지 않은 토큰입니다"}
)

// 어떤 구조체가 이름이 Error고 반환값이 string일 경우 Error 타입으로 취급
func (e *AppError) Error() string {
	return fmt.Sprintf("Code: %d, Message: %s", e.Code, e.Message)
}
