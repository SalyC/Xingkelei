package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"

	"backend/internal/models"
)

type CourseHandler struct {
	db *gorm.DB
}

func NewCourseHandler(db *gorm.DB) *CourseHandler {
	return &CourseHandler{db: db}
}

func (h *CourseHandler) GetMyCourses(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uint)
	var courses []models.Course
	h.db.Joins("JOIN user_courses ON user_courses.course_id = courses.id").
		Where("user_courses.user_id = ?", userID).Find(&courses)
	return c.JSON(fiber.Map{"data": courses})
}

func (h *CourseHandler) GetAllCourses(c *fiber.Ctx) error {
	var courses []models.Course
	h.db.Where("is_published = ?", true).Find(&courses)
	return c.JSON(fiber.Map{"data": courses})
}

func (h *CourseHandler) GetCourse(c *fiber.Ctx) error {
	id, _ := strconv.Atoi(c.Params("id"))
	userID := c.Locals("user_id").(uint)

	var course models.Course
	if err := h.db.Preload("Lessons").First(&course, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Course not found"})
	}

	var userCourse models.UserCourse
	hasAccess := h.db.Where("user_id = ? AND course_id = ?", userID, id).First(&userCourse).Error == nil

	return c.JSON(fiber.Map{"data": fiber.Map{"course": course, "has_access": hasAccess}})
}

func (h *CourseHandler) GetLesson(c *fiber.Ctx) error {
	courseID, _ := strconv.Atoi(c.Params("id"))
	lessonID, _ := strconv.Atoi(c.Params("lessonId"))
	userID := c.Locals("user_id").(uint)

	var userCourse models.UserCourse
	if err := h.db.Where("user_id = ? AND course_id = ?", userID, courseID).First(&userCourse).Error; err != nil {
		return c.Status(403).JSON(fiber.Map{"error": "Access denied"})
	}

	var lesson models.Lesson
	if err := h.db.Where("id = ? AND course_id = ?", lessonID, courseID).First(&lesson).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Lesson not found"})
	}
	return c.JSON(fiber.Map{"data": lesson})
}

// ActivateWithCode активирует курс по коду доступа
type ActivateRequest struct {
	Code string `json:"code"`
}

func (h *CourseHandler) ActivateWithCode(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uint)
	courseID, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid course ID"})
	}

	var req ActivateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	var course models.Course
	if err := h.db.First(&course, courseID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Course not found"})
	}

	// Код доступа по умолчанию DEV2026 (или берём из поля, если задано)
	expectedCode := course.AccessCode
	if expectedCode == "" {
		expectedCode = "DEV2026"
	}

	if req.Code != expectedCode {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid access code"})
	}

	// Проверяем, не активирован ли уже курс
	var existing models.UserCourse
	if err := h.db.Where("user_id = ? AND course_id = ?", userID, courseID).First(&existing).Error; err == nil {
		return c.Status(400).JSON(fiber.Map{"error": "Course already activated"})
	}

	userCourse := models.UserCourse{
		UserID:   userID,
		CourseID: uint(courseID),
	}
	if err := h.db.Create(&userCourse).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to activate course"})
	}

	return c.JSON(fiber.Map{"message": "Course activated successfully"})
}
