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
	ErrNotFound           = &AppError{Code: http.StatusNotFound, Message: "resource not found"}
	ErrInvalidRequest     = &AppError{Code: http.StatusBadRequest, Message: "invalid request"}
	ErrUnauthorized       = &AppError{Code: http.StatusUnauthorized, Message: "unauthorized"}
	ErrInternalServer     = &AppError{Code: http.StatusInternalServerError, Message: "internal server error"}
	ErrInvalidCredentials = &AppError{Code: http.StatusUnauthorized, Message: "invalid email or password"}
	ErrInvalidToken       = &AppError{Code: http.StatusUnauthorized, Message: "invalid or expired token"}
)

// AppError implements the error interface.
func (e *AppError) Error() string {
	return fmt.Sprintf("Code: %d, Message: %s", e.Code, e.Message)
}
