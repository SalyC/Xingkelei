package email

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
)

type BrevoRequest struct {
	Sender      BrevoSender      `json:"sender"`
	To          []BrevoRecipient `json:"to"`
	Subject     string           `json:"subject"`
	HTMLContent string           `json:"htmlContent"`
}

type BrevoSender struct {
	Name  string `json:"name"`
	Email string `json:"email"`
}

type BrevoRecipient struct {
	Email string `json:"email"`
}

func SendVerificationCode(to, code string) error {
	apiKey := os.Getenv("BREVO_API_KEY")
	if apiKey == "" {
		return fmt.Errorf("BREVO_API_KEY is not set")
	}

	fromEmail := os.Getenv("BREVO_FROM_EMAIL")
	fromName := os.Getenv("BREVO_FROM_NAME")
	if fromEmail == "" {
		fromEmail = "GM_on_the_rakbot@gmail.com" // fallback
	}
	if fromName == "" {
		fromName = "Клуб Синкэлэй"
	}

	html := fmt.Sprintf(
		"<h2>Ваш код подтверждения: <strong>%s</strong></h2><p>Введите его на сайте для завершения регистрации.</p>",
		code,
	)

	request := BrevoRequest{
		Sender:      BrevoSender{Name: fromName, Email: fromEmail},
		To:          []BrevoRecipient{{Email: to}},
		Subject:     "Код подтверждения Клуб Синкэлэй",
		HTMLContent: html,
	}

	body, _ := json.Marshal(request)
	req, _ := http.NewRequest("POST", "https://api.brevo.com/v3/smtp/email", bytes.NewBuffer(body))
	req.Header.Set("api-key", apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 && resp.StatusCode != 201 {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("brevo returned status %d: %s", resp.StatusCode, string(bodyBytes))
	}
	return nil
}
