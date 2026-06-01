package models

import (
	"time"

	"gorm.io/gorm"
)

type Certificate struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	UserID    uint           `json:"user_id"`
	CourseID  uint           `json:"course_id"`
	Course    Course         `gorm:"foreignKey:CourseID" json:"course,omitempty"`
	FileURL   string         `json:"file_url"`
	IssuedAt  time.Time      `json:"issued_at"`
}
