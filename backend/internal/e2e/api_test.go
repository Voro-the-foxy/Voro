//go:build e2e

package e2e

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"voro/backend/internal/gateway/postgres"
	"voro/backend/internal/server"
)

func newTestServer(t *testing.T) *httptest.Server {
	t.Helper()
	dsn := os.Getenv("TEST_DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://voro:voro@localhost:5433/voro?sslmode=disable"
	}
	db, err := postgres.Open(dsn)
	if err != nil {
		t.Skipf("test DB unavailable (%v) — run `make db-up` first", err)
	}
	if err := postgres.ApplyMigrations(db); err != nil {
		t.Fatalf("migrations failed: %v", err)
	}
	t.Cleanup(func() { db.Close() })
	return httptest.NewServer(server.NewHandler(db, ""))
}

func login(t *testing.T, srv *httptest.Server) string {
	t.Helper()
	body := `{"email":"demo@voro.app","password":"voro1234"}`
	resp, err := http.Post(srv.URL+"/api/auth/login", "application/json", bytes.NewBufferString(body))
	if err != nil {
		t.Fatalf("login request failed: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("login: expected 200, got %d", resp.StatusCode)
	}
	var result struct {
		Token string `json:"token"`
	}
	json.NewDecoder(resp.Body).Decode(&result)
	if result.Token == "" {
		t.Fatal("login: empty token in response")
	}
	return result.Token
}

func authGet(t *testing.T, srv *httptest.Server, token, path string) *http.Response {
	t.Helper()
	req, _ := http.NewRequest("GET", srv.URL+path, nil)
	req.Header.Set("Authorization", "Bearer "+token)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("GET %s failed: %v", path, err)
	}
	return resp
}

func authPost(t *testing.T, srv *httptest.Server, token, path string, body any) *http.Response {
	t.Helper()
	b, _ := json.Marshal(body)
	req, _ := http.NewRequest("POST", srv.URL+path, bytes.NewReader(b))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("POST %s failed: %v", path, err)
	}
	return resp
}

// ──────────────────────────────────────────
// Tests
// ──────────────────────────────────────────

func TestHealth(t *testing.T) {
	srv := newTestServer(t)
	defer srv.Close()

	resp, err := http.Get(srv.URL + "/api/health")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Errorf("health: expected 200, got %d", resp.StatusCode)
	}
}

func TestAuthFlow(t *testing.T) {
	srv := newTestServer(t)
	defer srv.Close()

	// login with valid credentials
	token := login(t, srv)

	// access protected endpoint
	resp := authGet(t, srv, token, "/api/classes")
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Errorf("GET /api/classes: expected 200, got %d", resp.StatusCode)
	}

	// bad credentials
	body := `{"email":"wrong@example.com","password":"wrong"}`
	bad, _ := http.Post(srv.URL+"/api/auth/login", "application/json", bytes.NewBufferString(body))
	defer bad.Body.Close()
	if bad.StatusCode == http.StatusOK {
		t.Error("bad credentials should not return 200")
	}
}

func TestClassFlow(t *testing.T) {
	srv := newTestServer(t)
	defer srv.Close()
	token := login(t, srv)

	// add a class
	resp := authPost(t, srv, token, "/api/classes", map[string]string{"name": "E2E Test Class"})
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusCreated {
		t.Fatalf("POST /api/classes: expected 201, got %d", resp.StatusCode)
	}

	var created struct {
		ID   string `json:"id"`
		Name string `json:"name"`
	}
	json.NewDecoder(resp.Body).Decode(&created)
	if created.ID == "" {
		t.Fatal("expected class ID in response")
	}

	// list classes — should contain the new one
	listResp := authGet(t, srv, token, "/api/classes")
	defer listResp.Body.Close()
	if listResp.StatusCode != http.StatusOK {
		t.Fatalf("GET /api/classes: expected 200, got %d", listResp.StatusCode)
	}

	// delete the class
	req, _ := http.NewRequest("DELETE", fmt.Sprintf("%s/api/classes/%s", srv.URL, created.ID), nil)
	req.Header.Set("Authorization", "Bearer "+token)
	delResp, _ := http.DefaultClient.Do(req)
	defer delResp.Body.Close()
	if delResp.StatusCode != http.StatusNoContent {
		t.Errorf("DELETE /api/classes/%s: expected 204, got %d", created.ID, delResp.StatusCode)
	}
}

func TestAttemptFlow(t *testing.T) {
	srv := newTestServer(t)
	defer srv.Close()
	token := login(t, srv)

	// save an attempt
	payload := map[string]any{
		"class_id":        "test-class",
		"quiz_id":         "test-quiz",
		"lecture_title":   "E2E Lecture",
		"question_ids":    []string{"q1", "q2"},
		"answers":         []int{0, 1},
		"correct_indices": []int{0, 1},
		"score":           2,
		"total":           2,
	}
	resp := authPost(t, srv, token, "/api/attempts", payload)
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusCreated {
		t.Fatalf("POST /api/attempts: expected 201, got %d", resp.StatusCode)
	}

	var saved struct {
		ID    string `json:"id"`
		Score int    `json:"score"`
	}
	json.NewDecoder(resp.Body).Decode(&saved)
	if saved.ID == "" {
		t.Fatal("expected attempt ID")
	}
	if saved.Score != 2 {
		t.Errorf("expected score=2, got %d", saved.Score)
	}

	// retrieve by ID
	getResp := authGet(t, srv, token, "/api/attempts/"+saved.ID)
	defer getResp.Body.Close()
	if getResp.StatusCode != http.StatusOK {
		t.Errorf("GET /api/attempts/%s: expected 200, got %d", saved.ID, getResp.StatusCode)
	}
}
