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
	"time"

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

// signup registers a fresh user and returns its session token. The email is
// unique per call so repeated test runs against a persistent DB don't collide.
func signup(t *testing.T, srv *httptest.Server) string {
	t.Helper()
	email := fmt.Sprintf("user-%d@e2e.test", time.Now().UnixNano())
	body := map[string]string{"email": email, "name": "E2E User", "password": "secret123"}
	resp := postJSON(t, srv, "/api/auth/signup", body)
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusCreated {
		t.Fatalf("signup: expected 201, got %d", resp.StatusCode)
	}
	var result struct {
		Token string `json:"token"`
	}
	json.NewDecoder(resp.Body).Decode(&result)
	if result.Token == "" {
		t.Fatal("signup: empty token in response")
	}
	return result.Token
}

func postJSON(t *testing.T, srv *httptest.Server, path string, body any) *http.Response {
	t.Helper()
	b, _ := json.Marshal(body)
	resp, err := http.Post(srv.URL+path, "application/json", bytes.NewReader(b))
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

func TestUnauthenticated(t *testing.T) {
	srv := newTestServer(t)
	defer srv.Close()

	// no Authorization header → protected route rejects with 401
	resp, err := http.Get(srv.URL + "/api/classes")
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusUnauthorized {
		t.Errorf("GET /api/classes without token: expected 401, got %d", resp.StatusCode)
	}
}

func TestSignupDuplicateEmail(t *testing.T) {
	srv := newTestServer(t)
	defer srv.Close()

	email := fmt.Sprintf("dup-%d@e2e.test", time.Now().UnixNano())
	body := map[string]string{"email": email, "name": "Dup", "password": "secret123"}

	first := postJSON(t, srv, "/api/auth/signup", body)
	first.Body.Close()
	if first.StatusCode != http.StatusCreated {
		t.Fatalf("first signup: expected 201, got %d", first.StatusCode)
	}

	second := postJSON(t, srv, "/api/auth/signup", body)
	second.Body.Close()
	if second.StatusCode != http.StatusConflict {
		t.Errorf("duplicate signup: expected 409, got %d", second.StatusCode)
	}
}

// TestUserDataIsolation is the regression test for the core bug: two distinct
// users must not see each other's data.
func TestUserDataIsolation(t *testing.T) {
	srv := newTestServer(t)
	defer srv.Close()

	tokenA := signup(t, srv)
	tokenB := signup(t, srv)

	// User A creates a class.
	resp := authPost(t, srv, tokenA, "/api/classes", map[string]string{"name": "A-Only Class"})
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusCreated {
		t.Fatalf("A POST /api/classes: expected 201, got %d", resp.StatusCode)
	}
	var aClass struct {
		ID string `json:"id"`
	}
	json.NewDecoder(resp.Body).Decode(&aClass)

	// User B lists classes and must not see A's class.
	listResp := authGet(t, srv, tokenB, "/api/classes")
	defer listResp.Body.Close()
	var bClasses []struct {
		ID   string `json:"id"`
		Name string `json:"name"`
	}
	json.NewDecoder(listResp.Body).Decode(&bClasses)
	for _, c := range bClasses {
		if c.ID == aClass.ID {
			t.Fatalf("user B can see user A's class %q — data is not isolated", c.ID)
		}
	}

	// User A still sees their own class.
	aListResp := authGet(t, srv, tokenA, "/api/classes")
	defer aListResp.Body.Close()
	var aClasses []struct {
		ID string `json:"id"`
	}
	json.NewDecoder(aListResp.Body).Decode(&aClasses)
	found := false
	for _, c := range aClasses {
		if c.ID == aClass.ID {
			found = true
		}
	}
	if !found {
		t.Error("user A cannot see their own class")
	}
}
