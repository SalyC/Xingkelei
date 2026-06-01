package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"

	"backend/internal/models"
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
	h.db.Select("id, first_name, last_name, email, role, is_blocked, created_at").Find(&users)
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
