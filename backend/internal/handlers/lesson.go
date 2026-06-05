package handlers

import (
	"embed"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jung-kurt/gofpdf"
	"gorm.io/gorm"

	"backend/internal/models"
)

var dejavuFont embed.FS

type LessonHandler struct {
	db *gorm.DB
}

func NewLessonHandler(db *gorm.DB) *LessonHandler {
	return &LessonHandler{db: db}
}

func generateCertificatePDF(user models.User, course models.Course, certID uint) (string, error) {
	// Путь для сохранения (на Render используется /tmp, локально – ./uploads/certificates)
	certDir := "/tmp/uploads/certificates"
	if err := os.MkdirAll(certDir, 0755); err != nil {
		return "", err
	}

	filename := fmt.Sprintf("cert_%d_%d.pdf", certID, time.Now().Unix())
	filePath := filepath.Join(certDir, filename)

	pdf := gofpdf.New("L", "mm", "A4", "")
	pdf.AddPage()

	// Читаем встроенный шрифт
	fontBytes, err := dejavuFont.ReadFile("font/DejaVuSans.ttf")
	if err != nil {
		return "", fmt.Errorf("не удалось прочитать шрифт: %w", err)
	}
	pdf.AddUTF8FontFromBytes("DejaVu", "", fontBytes)

	pdf.SetFont("DejaVu", "", 24)
	pdf.Cell(0, 10, "Сертификат об окончании курса")
	pdf.Ln(20)

	pdf.SetFont("DejaVu", "", 16)
	pdf.Cell(0, 10, "Настоящий сертификат удостоверяет, что")
	pdf.Ln(10)

	pdf.SetFont("DejaVu", "", 20)
	pdf.Cell(0, 10, fmt.Sprintf("%s %s", user.FirstName, user.LastName))
	pdf.Ln(15)

	pdf.SetFont("DejaVu", "", 16)
	pdf.Cell(0, 10, "успешно завершил(а) курс")
	pdf.Ln(10)

	pdf.SetFont("DejaVu", "", 18)
	pdf.Cell(0, 10, fmt.Sprintf("\"%s\"", course.Title))
	pdf.Ln(15)

	pdf.SetFont("DejaVu", "", 14)
	pdf.Cell(0, 10, fmt.Sprintf("Дата выдачи: %s", time.Now().Format("02.01.2006")))
	pdf.Ln(20)

	pdf.SetFont("DejaVu", "", 12)
	pdf.Cell(0, 10, "Клуб Синкэлэй – облачная платформа цифрового образования")

	if err := pdf.OutputFileAndClose(filePath); err != nil {
		return "", err
	}
	return filename, nil
}

// CompleteLesson отмечает урок как выполненный
func (h *LessonHandler) CompleteLesson(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uint)
	courseID, _ := strconv.Atoi(c.Params("courseId"))
	lessonID, _ := strconv.Atoi(c.Params("lessonId"))

	// Проверяем доступ к курсу
	var userCourse models.UserCourse
	if err := h.db.Where("user_id = ? AND course_id = ?", userID, courseID).First(&userCourse).Error; err != nil {
		return c.Status(403).JSON(fiber.Map{"error": "Access denied"})
	}

	// Проверяем существование урока
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

	var course models.Course
	h.db.First(&course, courseID)
	var user models.User
	h.db.First(&user, userID)

	// Создаём сертификат в БД (пока без файла)
	certificate := models.Certificate{
		UserID:   userID,
		CourseID: uint(courseID),
		IssuedAt: time.Now(),
	}
	if err := h.db.Create(&certificate).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to create certificate"})
	}

	// Генерируем PDF
	pdfFilename, err := generateCertificatePDF(user, course, certificate.ID)
	if err != nil {
		log.Printf("Failed to generate certificate PDF: %v", err)
		// оставляем file_url пустым, сертификат без файла
	} else {
		certificate.FileURL = "/certificates/" + pdfFilename
		h.db.Save(&certificate)
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
