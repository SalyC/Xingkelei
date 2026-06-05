package email

import (
	"fmt"
	"os"

	"github.com/resend/resend-go/v2"
)

func SendVerificationCode(to, code string) error {
	apiKey := os.Getenv("RESEND_API_KEY")
	if apiKey == "" {
		return fmt.Errorf("RESEND_API_KEY is not set")
	}

	client := resend.NewClient(apiKey)

	from := os.Getenv("RESEND_FROM")
	if from == "" {
		from = "onboarding@resend.dev"
	}

	html := fmt.Sprintf(
		"<h2>Ваш код подтверждения: <strong>%s</strong></h2><p>Введите его на сайте для завершения регистрации.</p>",
		code,
	)

	params := &resend.SendEmailRequest{
		From:    from,
		To:      []string{to},
		Subject: "Код подтверждения Клуб Синкэлэй",
		Html:    html,
	}

	_, err := client.Emails.Send(params)
	if err != nil {
		return fmt.Errorf("Resend send error: %w", err)
	}
	return nil
}
