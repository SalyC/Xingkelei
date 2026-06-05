package email

import (
	"fmt"
	"net/smtp"
	"os"
)

func SendVerificationCode(to, code string) error {
	from := os.Getenv("SMTP_EMAIL")
	password := os.Getenv("SMTP_PASSWORD")
	host := os.Getenv("SMTP_HOST")
	port := os.Getenv("SMTP_PORT")

	msg := fmt.Sprintf("From: %s\r\n", from) +
		fmt.Sprintf("To: %s\r\n", to) +
		"Subject: Код подтверждения Клуб Синкэлэй\r\n" +
		"MIME-version: 1.0;\r\n" +
		"Content-Type: text/html; charset=\"UTF-8\";\r\n" +
		"\r\n" +
		fmt.Sprintf("<h2>Ваш код подтверждения: <strong>%s</strong></h2><p>Введите этот код на сайте для завершения регистрации.</p>", code)

	auth := smtp.PlainAuth("", from, password, host)
	return smtp.SendMail(host+":"+port, auth, from, []string{to}, []byte(msg))
}
