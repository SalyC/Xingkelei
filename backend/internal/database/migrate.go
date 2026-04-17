package database

import (
	"backend/internal/models"

	"gorm.io/gorm"
)

func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(
		&models.User{},
		&models.Course{},
		&models.Lesson{},
		&models.UserCourse{},
		&models.Certificate{},
	)
}
