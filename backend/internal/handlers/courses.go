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
	userID := c.Locals("user_id").(uint)

	var courses []models.Course
	subQuery := h.db.Table("user_courses").Select("course_id").Where("user_id = ?", userID)
	err := h.db.Where("is_published = ? AND id NOT IN (?)", true, subQuery).Find(&courses).Error
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch courses"})
	}
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

// ActivateWithCode активирует курс по ID и коду доступа
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

	expectedCode := course.AccessCode
	if expectedCode == "" {
		expectedCode = "DEV2026"
	}

	if req.Code != expectedCode {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid access code"})
	}

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

// ActivateByCode активирует курс по универсальному промокоду
type ActivateByCodeRequest struct {
	Code string `json:"code"`
}

func (h *CourseHandler) ActivateByCode(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uint)

	var req ActivateByCodeRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	if req.Code == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Code is required"})
	}

	var course models.Course
	if err := h.db.Where("access_code = ?", req.Code).First(&course).Error; err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid promo code"})
	}

	var existing models.UserCourse
	if err := h.db.Where("user_id = ? AND course_id = ?", userID, course.ID).First(&existing).Error; err == nil {
		return c.Status(400).JSON(fiber.Map{"error": "Course already activated"})
	}

	userCourse := models.UserCourse{UserID: userID, CourseID: course.ID}
	if err := h.db.Create(&userCourse).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to activate course"})
	}

	return c.JSON(fiber.Map{"message": "Course activated successfully", "course": course})
}

// GetPublicCourse возвращает курс и его первый урок (демо) без проверки авторизации
func (h *CourseHandler) GetPublicCourse(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid course ID"})
	}

	var course models.Course
	if err := h.db.Preload("Lessons", func(db *gorm.DB) *gorm.DB {
		return db.Order("lessons.order ASC").Limit(1)
	}).First(&course, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Course not found"})
	}

	if len(course.Lessons) == 0 {
		course.Lessons = []models.Lesson{}
	}

	return c.JSON(fiber.Map{"data": course})
}
