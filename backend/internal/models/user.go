package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID               uint           `gorm:"primarykey" json:"id"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
	DeletedAt        gorm.DeletedAt `gorm:"index" json:"-"`
	Email            string         `gorm:"uniqueIndex;not null" json:"email"`
	Password         string         `gorm:"not null" json:"-"`
	FirstName        string         `json:"first_name"`
	LastName         string         `json:"last_name"`
	Role             string         `gorm:"default:'student'" json:"role"`
	IsBlocked        bool           `gorm:"default:false" json:"is_blocked"`
	AvatarURL        string         `json:"avatar_url"`
	BanReason        string         `json:"ban_reason,omitempty"`
	BannedAt         *time.Time     `json:"banned_at,omitempty"`
	IsVerified       bool           `gorm:"default:false" json:"is_verified"`
	VerificationCode string         `json:"-"`
	TelegramChatID   int64          `json:"telegram_chat_id,omitempty"`
}
