package auth

import (
	"encoding/json"
	"net/http"
	"strings"

	"voro/backend/internal/domain"
	authsvc "voro/backend/internal/service/auth"
	"voro/backend/internal/shared/httputil"
)

type Handler struct {
	Service *authsvc.Service
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequestDTO
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}
	session, err := h.Service.Login(req.Email, req.Password)
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	httputil.WriteJSON(w, http.StatusOK, LoginResponseDTO{
		Token: session.Token,
		User:  toUserDTO(session.User),
	})
}

func (h *Handler) Me(w http.ResponseWriter, r *http.Request) {
	user, err := h.Service.Me(bearerToken(r))
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	httputil.WriteJSON(w, http.StatusOK, toUserDTO(user))
}

func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	h.Service.Logout(bearerToken(r))
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) DeleteAccount(w http.ResponseWriter, r *http.Request) {
	if err := h.Service.DeleteAccount(bearerToken(r)); err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
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

func toUserDTO(user domain.User) UserDTO {
	return UserDTO{ID: user.ID, Email: user.Email, Name: user.Name}
}
