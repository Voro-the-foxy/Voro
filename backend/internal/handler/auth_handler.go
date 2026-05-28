package handler

import (
	"encoding/json"
	"net/http"
	"strings"

	"nomilk/backend/internal/domain"
	"nomilk/backend/internal/handler/dto"
	"nomilk/backend/internal/service"
)

type AuthHandler struct {
	Service *service.AuthService
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req dto.LoginRequestDTO
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "잘못된 요청입니다", http.StatusBadRequest)
		return
	}

	session, err := h.Service.Login(req.Email, req.Password)
	if err != nil {
		writeError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, dto.LoginResponseDTO{
		Token: session.Token,
		User:  toUserDTO(session.User),
	})
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	user, err := h.Service.Me(bearerToken(r))
	if err != nil {
		http.Error(w, "권한이 없습니다", http.StatusUnauthorized)
		return
	}

	writeJSON(w, http.StatusOK, toUserDTO(user))
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	h.Service.Logout(bearerToken(r))
	w.WriteHeader(http.StatusNoContent)
}

func (h *AuthHandler) DeleteAccount(w http.ResponseWriter, r *http.Request) {
	if err := h.Service.DeleteAccount(bearerToken(r)); err != nil {
		http.Error(w, "권한이 없습니다", http.StatusUnauthorized)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func bearerToken(r *http.Request) string {
	value := r.Header.Get("Authorization")
	token, ok := strings.CutPrefix(value, "Bearer ")
	if !ok {
		return ""
	}
	return strings.TrimSpace(token)
}

func toUserDTO(user domain.User) dto.UserDTO {
	return dto.UserDTO{
		ID:    user.ID,
		Email: user.Email,
		Name:  user.Name,
	}
}
