package handlers

import (
	"strconv"
	"time"

	"backend/internal/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type AdminHandler struct {
	db *gorm.DB
}

func NewAdminHandler(db *gorm.DB) *AdminHandler {
	return &AdminHandler{db: db}
}

// GetUsers возвращает список всех пользователей
func (h *AdminHandler) GetUsers(c *fiber.Ctx) error {
	var users []models.User
	h.db.Select("id, first_name, last_name, email, role, is_blocked, ban_reason, banned_at, created_at").Find(&users)
	return c.JSON(fiber.Map{"data": users})
}

// ToggleBlock блокирует или разблокирует пользователя
func (h *AdminHandler) ToggleBlock(c *fiber.Ctx) error {
	userID, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid user ID"})
	}
	var user models.User
	if err := h.db.First(&user, userID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}
	user.IsBlocked = !user.IsBlocked
	if user.IsBlocked {
		now := time.Now()
		user.BannedAt = &now
		if user.BanReason == "" {
			user.BanReason = "Нарушение правил платформы"
		}
	} else {
		user.BanReason = ""
		user.BannedAt = nil
	}
	h.db.Save(&user)
	return c.JSON(fiber.Map{"message": "Status updated", "is_blocked": user.IsBlocked})
}

// GetUserCourses возвращает курсы, купленные пользователем
func (h *AdminHandler) GetUserCourses(c *fiber.Ctx) error {
	userID, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid user ID"})
	}
	var courses []models.Course
	h.db.Joins("JOIN user_courses ON user_courses.course_id = courses.id").
		Where("user_courses.user_id = ?", userID).Find(&courses)
	return c.JSON(fiber.Map{"data": courses})
}

// GetAllCoursesForAdmin возвращает все курсы (даже неопубликованные)
func (h *AdminHandler) GetAllCoursesForAdmin(c *fiber.Ctx) error {
	var courses []models.Course
	h.db.Find(&courses)
	return c.JSON(fiber.Map{"data": courses})
}

// GetLessonsForAdmin возвращает уроки курса (для админа)
func (h *AdminHandler) GetLessonsForAdmin(c *fiber.Ctx) error {
	courseID, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid course ID"})
	}
	var lessons []models.Lesson
	h.db.Where("course_id = ?", courseID).Order("order ASC").Find(&lessons)
	return c.JSON(fiber.Map{"data": lessons})
}

// UpdateLessonAdmin обновляет видеоурок (и другие поля при желании)
type UpdateLessonAdminRequest struct {
	VideoURL string `json:"video_url"`
	AudioURL string `json:"audio_url,omitempty"`
	Title    string `json:"title,omitempty"`
	Content  string `json:"content,omitempty"`
}

func (h *AdminHandler) UpdateLessonAdmin(c *fiber.Ctx) error {
	lessonID, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid lesson ID"})
	}
	var lesson models.Lesson
	if err := h.db.First(&lesson, lessonID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Lesson not found"})
	}
	var req UpdateLessonAdminRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	// Обновляем только переданные поля
	if req.VideoURL != "" {
		lesson.VideoURL = req.VideoURL
	}
	if req.AudioURL != "" {
		lesson.AudioURL = req.AudioURL
	}
	if req.Title != "" {
		lesson.Title = req.Title
	}
	if req.Content != "" {
		lesson.Content = req.Content
	}

	h.db.Save(&lesson)
	return c.JSON(fiber.Map{"message": "Lesson updated", "data": lesson})
}

// UpdateUserRole меняет роль пользователя
type UpdateRoleRequest struct {
	Role string `json:"role"`
}

func (h *AdminHandler) UpdateUserRole(c *fiber.Ctx) error {
	id, _ := strconv.Atoi(c.Params("id"))
	var user models.User
	if err := h.db.First(&user, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}
	var req UpdateRoleRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid role"})
	}
	user.Role = req.Role
	h.db.Save(&user)
	return c.JSON(fiber.Map{"data": user})
}

// DeleteUser удаляет пользователя
func (h *AdminHandler) DeleteUser(c *fiber.Ctx) error {
	id, _ := strconv.Atoi(c.Params("id"))
	if err := h.db.Delete(&models.User{}, id).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Deletion failed"})
	}
	return c.JSON(fiber.Map{"message": "User deleted"})
}

// CreateLesson создаёт новый урок для курса
type CreateLessonRequest struct {
	Title    string `json:"title"`
	Content  string `json:"content"`
	VideoURL string `json:"video_url"`
	AudioURL string `json:"audio_url"`
	Order    int    `json:"order"`
}

func (h *AdminHandler) CreateLesson(c *fiber.Ctx) error {
	courseID, err := strconv.Atoi(c.Params("courseId"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid course ID"})
	}
	var req CreateLessonRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}
	lesson := models.Lesson{
		CourseID: uint(courseID),
		Title:    req.Title,
		Content:  req.Content,
		VideoURL: req.VideoURL,
		AudioURL: req.AudioURL,
		Order:    req.Order,
	}
	if err := h.db.Create(&lesson).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to create lesson"})
	}
	return c.Status(201).JSON(fiber.Map{"data": lesson})
}

// BanUser банит пользователя с причиной
type BanRequest struct {
	Reason string `json:"reason"`
}

func (h *AdminHandler) BanUser(c *fiber.Ctx) error {
	id, _ := strconv.Atoi(c.Params("id"))
	var user models.User
	if err := h.db.First(&user, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}
	var req BanRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}
	now := time.Now()
	user.IsBlocked = true
	user.BanReason = req.Reason
	user.BannedAt = &now
	h.db.Save(&user)
	return c.JSON(fiber.Map{"data": user})
}

// UnbanUser разблокирует пользователя
func (h *AdminHandler) UnbanUser(c *fiber.Ctx) error {
	id, _ := strconv.Atoi(c.Params("id"))
	var user models.User
	if err := h.db.First(&user, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}
	user.IsBlocked = false
	user.BanReason = ""
	user.BannedAt = nil
	h.db.Save(&user)
	return c.JSON(fiber.Map{"data": user})
}
