package models

import "time"

type Certificate struct {
	ID        uint      `gorm:"primarykey" json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	UserID    uint      `json:"user_id"`
	CourseID  uint      `json:"course_id"`
	FileURL   string    `json:"file_url"`
	IssuedAt  time.Time `json:"issued_at"`
}
