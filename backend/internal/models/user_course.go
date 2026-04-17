package models

import "time"

type UserCourse struct {
	UserID     uint      `gorm:"primaryKey" json:"user_id"`
	CourseID   uint      `gorm:"primaryKey" json:"course_id"`
	EnrolledAt time.Time `json:"enrolled_at"`
}
