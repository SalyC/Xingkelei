package telegram

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
)

type Update struct {
	UpdateID int64   `json:"update_id"`
	Message  Message `json:"message"`
}

type Message struct {
	MessageID int64  `json:"message_id"`
	Text      string `json:"text"`
	Chat      Chat   `json:"chat"`
}

type Chat struct {
	ID int64 `json:"id"`
}

type GetUpdatesResponse struct {
	OK     bool     `json:"ok"`
	Result []Update `json:"result"`
}

func StartBot() {
	botToken := os.Getenv("TELEGRAM_BOT_TOKEN")
	if botToken == "" {
		log.Println("TELEGRAM_BOT_TOKEN not set, Telegram bot disabled")
		return
	}

	var offset int64 = 0
	baseURL := fmt.Sprintf("https://api.telegram.org/bot%s", botToken)

	for {
		updates, err := getUpdates(baseURL, offset)
		if err != nil {
			log.Printf("Telegram getUpdates error: %v", err)
			time.Sleep(5 * time.Second)
			continue
		}

		for _, update := range updates {
			offset = update.UpdateID + 1
			if update.Message.Text != "" && update.Message.Chat.ID != 0 {
				handleMessage(baseURL, update.Message)
			}
		}
		time.Sleep(1 * time.Second)
	}
}

func getUpdates(baseURL string, offset int64) ([]Update, error) {
	url := fmt.Sprintf("%s/getUpdates?offset=%d&timeout=5", baseURL, offset)
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var result GetUpdatesResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, err
	}
	return result.Result, nil
}

func handleMessage(baseURL string, msg Message) {
	text := msg.Text
	chatID := msg.Chat.ID

	if strings.HasPrefix(text, "/start") {
		parts := strings.SplitN(text, " ", 2)
		if len(parts) == 2 && parts[1] != "" {
			code := parts[1]
			reply := fmt.Sprintf("Ваш код подтверждения: %s", code)
			sendMessage(baseURL, chatID, reply)
		} else {
			sendMessage(baseURL, chatID, "Привет! Я бот Клуба Синкэлэй. Чтобы подтвердить аккаунт, перейдите по ссылке, которую вы получили при регистрации.")
		}
	} else {
		sendMessage(baseURL, chatID, "Я ожидаю код подтверждения. Используйте /start КОД или перейдите по ссылке из регистрации.")
	}
}

func sendMessage(baseURL string, chatID int64, text string) {
	url := fmt.Sprintf("%s/sendMessage?chat_id=%d&text=%s", baseURL, chatID, text)
	http.Get(url)
}
