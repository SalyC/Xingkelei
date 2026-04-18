package models

import (
	"time"

	"gorm.io/gorm"
)

type Course struct {
	ID          uint           `gorm:"primarykey" json:"id"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
	Title       string         `json:"title"`
	Description string         `json:"description"`
	Price       float64        `json:"price"`
	IsPublished bool           `gorm:"default:true" json:"is_published"`
	ImageURL    string         `json:"image_url"`
	AccessCode  string         `gorm:"default:'DEV2026'" json:"access_code"`
	Lessons     []Lesson       `gorm:"foreignKey:CourseID" json:"lessons,omitempty"`
}
