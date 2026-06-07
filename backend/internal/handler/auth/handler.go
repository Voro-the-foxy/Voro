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

// Signup godoc
//
//	@Summary		Sign up
//	@Tags			auth
//	@Accept			json
//	@Produce		json
//	@Param			body	body		SignupRequestDTO	true	"Signup payload"
//	@Success		201		{object}	LoginResponseDTO
//	@Failure		400		{string}	string	"invalid request body"
//	@Failure		409		{string}	string	"email already exists"
//	@Router			/api/auth/signup [post]
func (h *Handler) Signup(w http.ResponseWriter, r *http.Request) {
	var req SignupRequestDTO
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}
	session, err := h.Service.Signup(req.Email, req.Name, req.Password)
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	httputil.WriteJSON(w, http.StatusCreated, LoginResponseDTO{
		Token: session.Token,
		User:  toUserDTO(session.User),
	})
}

// Login godoc
//
//	@Summary		Log in
//	@Tags			auth
//	@Accept			json
//	@Produce		json
//	@Param			body	body		LoginRequestDTO	true	"Login payload"
//	@Success		200		{object}	LoginResponseDTO
//	@Failure		400		{string}	string	"invalid request body"
//	@Failure		401		{string}	string	"invalid email or password"
//	@Router			/api/auth/login [post]
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

// Me godoc
//
//	@Summary		Get current user
//	@Tags			auth
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	UserDTO
//	@Failure		401	{string}	string	"unauthorized"
//	@Router			/api/auth/me [get]
func (h *Handler) Me(w http.ResponseWriter, r *http.Request) {
	user, err := h.Service.Me(bearerToken(r))
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	httputil.WriteJSON(w, http.StatusOK, toUserDTO(user))
}

// Logout godoc
//
//	@Summary		Log out
//	@Tags			auth
//	@Security		BearerAuth
//	@Success		204
//	@Router			/api/auth/logout [post]
func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	h.Service.Logout(bearerToken(r))
	w.WriteHeader(http.StatusNoContent)
}

// DeleteAccount godoc
//
//	@Summary		Delete account
//	@Tags			auth
//	@Security		BearerAuth
//	@Success		204
//	@Failure		401	{string}	string	"unauthorized"
//	@Router			/api/auth/account [delete]
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
