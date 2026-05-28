package handler

import (
	"encoding/json"
	"net/http"
	"nomilk/backend/internal/shared/errors"
)

func writeError(w http.ResponseWriter, err error) {
	if appErr, ok := err.(*errors.AppError); ok {
		http.Error(w, appErr.Message, appErr.Code)
		return
	}
	http.Error(w, err.Error(), http.StatusInternalServerError)
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(payload)
}
