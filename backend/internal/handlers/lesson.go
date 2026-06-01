package handlers

import (
	"strconv"
	"time"

	"backend/internal/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type LessonHandler struct {
	db *gorm.DB
}

func NewLessonHandler(db *gorm.DB) *LessonHandler {
	return &LessonHandler{db: db}
}

// CompleteLesson отмечает урок как выполненный
func (h *LessonHandler) CompleteLesson(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uint)
	courseID, _ := strconv.Atoi(c.Params("courseId"))
	lessonID, _ := strconv.Atoi(c.Params("lessonId"))

	// Проверяем доступ пользователя к курсу
	var userCourse models.UserCourse
	if err := h.db.Where("user_id = ? AND course_id = ?", userID, courseID).First(&userCourse).Error; err != nil {
		return c.Status(403).JSON(fiber.Map{"error": "Access denied"})
	}

	// Проверяем, что урок существует и принадлежит курсу
	var lesson models.Lesson
	if err := h.db.Where("id = ? AND course_id = ?", lessonID, courseID).First(&lesson).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Lesson not found"})
	}

	// Проверяем, не завершён ли уже
	var existing models.LessonCompletion
	if err := h.db.Where("user_id = ? AND lesson_id = ?", userID, lessonID).First(&existing).Error; err == nil {
		return c.Status(409).JSON(fiber.Map{"error": "Lesson already completed"})
	}

	completion := models.LessonCompletion{
		UserID:      userID,
		LessonID:    uint(lessonID),
		CourseID:    uint(courseID),
		CompletedAt: time.Now(),
	}
	if err := h.db.Create(&completion).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to complete lesson"})
	}

	return c.JSON(fiber.Map{"message": "Lesson completed", "completed": true})
}

// GetCourseProgress возвращает прогресс пользователя по курсу
func (h *LessonHandler) GetCourseProgress(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uint)
	courseID, _ := strconv.Atoi(c.Params("id"))

	var totalLessons int64
	h.db.Model(&models.Lesson{}).Where("course_id = ?", courseID).Count(&totalLessons)

	var completedLessons int64
	h.db.Model(&models.LessonCompletion{}).Where("user_id = ? AND course_id = ?", userID, courseID).Count(&completedLessons)

	// Получить ID завершённых уроков (для галочек на фронте)
	var completedIDs []uint
	h.db.Model(&models.LessonCompletion{}).
		Where("user_id = ? AND course_id = ?", userID, courseID).
		Pluck("lesson_id", &completedIDs)

	return c.JSON(fiber.Map{
		"data": fiber.Map{
			"total_lessons":        totalLessons,
			"completed_lessons":    completedLessons,
			"all_completed":        totalLessons == completedLessons && totalLessons > 0,
			"completed_lesson_ids": completedIDs,
		},
	})
}

// CompleteCourse завершает курс и выпускает сертификат
func (h *LessonHandler) CompleteCourse(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uint)
	courseID, _ := strconv.Atoi(c.Params("id"))

	// Проверяем, все ли уроки завершены
	var totalLessons int64
	h.db.Model(&models.Lesson{}).Where("course_id = ?", courseID).Count(&totalLessons)

	var completedLessons int64
	h.db.Model(&models.LessonCompletion{}).Where("user_id = ? AND course_id = ?", userID, courseID).Count(&completedLessons)

	if totalLessons == 0 || completedLessons < totalLessons {
		return c.Status(400).JSON(fiber.Map{"error": "Not all lessons completed"})
	}

	// Проверяем, нет ли уже сертификата
	var existing models.Certificate
	if err := h.db.Where("user_id = ? AND course_id = ?", userID, courseID).First(&existing).Error; err == nil {
		return c.JSON(fiber.Map{
			"message": "Certificate already issued",
			"certificate": fiber.Map{
				"id":        existing.ID,
				"course_id": existing.CourseID,
				"file_url":  existing.FileURL,
				"issued_at": existing.IssuedAt,
			},
		})
	}

	// Получаем информацию о курсе
	var course models.Course
	h.db.First(&course, courseID)

	// Создаём сертификат (пока заглушка PDF)
	certificate := models.Certificate{
		UserID:   userID,
		CourseID: uint(courseID),
		FileURL:  "/certificates/placeholder.pdf",
		IssuedAt: time.Now(),
	}
	if err := h.db.Create(&certificate).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to create certificate"})
	}

	return c.JSON(fiber.Map{
		"message": "Certificate issued",
		"certificate": fiber.Map{
			"id":           certificate.ID,
			"course_id":    certificate.CourseID,
			"course_title": course.Title,
			"issued_at":    certificate.IssuedAt,
			"file_url":     certificate.FileURL,
		},
	})
}

// GetMyCertificates возвращает все сертификаты пользователя
func (h *LessonHandler) GetMyCertificates(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uint)

	var certificates []models.Certificate
	h.db.Preload("Course").Where("user_id = ?", userID).Find(&certificates)

	// Формируем ответ
	var result []fiber.Map
	for _, cert := range certificates {
		result = append(result, fiber.Map{
			"id":           cert.ID,
			"course_id":    cert.CourseID,
			"course_title": cert.Course.Title,
			"issued_at":    cert.IssuedAt,
			"file_url":     cert.FileURL,
		})
	}

	return c.JSON(fiber.Map{"data": result})
}
