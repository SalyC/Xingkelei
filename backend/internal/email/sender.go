package email

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
)

type ResendEmail struct {
	From    string `json:"from"`
	To      string `json:"to"`
	Subject string `json:"subject"`
	HTML    string `json:"html"`
}

func SendVerificationCode(to, code string) error {
	apiKey := os.Getenv("RESEND_API_KEY")
	if apiKey == "" {
		return fmt.Errorf("RESEND_API_KEY is not set")
	}

	from := os.Getenv("RESEND_FROM")
	if from == "" {
		from = "onboarding@resend.dev"
	}

	html := fmt.Sprintf("<h2>Ваш код подтверждения: <strong>%s</strong></h2><p>Введите этот код на сайте для завершения регистрации.</p>", code)

	email := ResendEmail{
		From:    from,
		To:      to,
		Subject: "Код подтверждения Клуб Синкэлэй",
		HTML:    html,
	}

	body, _ := json.Marshal(email)
	req, _ := http.NewRequest("POST", "https://api.resend.com/emails", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 && resp.StatusCode != 201 {
		return fmt.Errorf("resend returned status %d", resp.StatusCode)
	}
	return nil
}
