package models

import "time"

type Lesson struct {
	ID        uint      `gorm:"primarykey" json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	CourseID  uint      `json:"course_id"`
	Title     string    `json:"title"`
	Content   string    `json:"content"`
	VideoURL  string    `json:"video_url,omitempty"`
	AudioURL  string    `json:"audio_url,omitempty"`
	Order     int       `json:"order"`
}
