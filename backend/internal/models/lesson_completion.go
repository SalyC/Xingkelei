package models

import "time"

type LessonCompletion struct {
	ID          uint      `gorm:"primarykey" json:"id"`
	UserID      uint      `gorm:"not null;uniqueIndex:idx_user_lesson" json:"user_id"`
	LessonID    uint      `gorm:"not null;uniqueIndex:idx_user_lesson" json:"lesson_id"`
	CourseID    uint      `gorm:"not null" json:"course_id"`
	CompletedAt time.Time `json:"completed_at"`
}
