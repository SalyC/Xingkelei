package handlers

import (
	"log"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/redis/go-redis/v9"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"backend/internal/models"
)

type AuthHandler struct {
	db    *gorm.DB
	redis *redis.Client
}

func NewAuthHandler(db *gorm.DB, redis *redis.Client) *AuthHandler {
	return &AuthHandler{db: db, redis: redis}
}

type RegisterRequest struct {
	Email     string `json:"email" validate:"required,email"`
	Password  string `json:"password" validate:"required,min=6"`
	FirstName string `json:"first_name" validate:"required"`
	LastName  string `json:"last_name" validate:"required"`
}

func (h *AuthHandler) Register(c *fiber.Ctx) error {
	var req RegisterRequest
	if err := c.BodyParser(&req); err != nil {
		log.Printf("Register: failed to parse body: %v", err)
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	log.Printf("Register attempt: email=%s, first_name=%s, last_name=%s", req.Email, req.FirstName, req.LastName)

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("Register: failed to hash password: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Internal server error"})
	}

	user := models.User{
		Email:     req.Email,
		Password:  string(hashedPassword),
		FirstName: req.FirstName,
		LastName:  req.LastName,
	}

	if err := h.db.Create(&user).Error; err != nil {
		log.Printf("Register: db create error: %v", err)
		return c.Status(400).JSON(fiber.Map{"error": "Email already exists"})
	}

	log.Printf("User registered: id=%d, email=%s", user.ID, user.Email)
	return c.Status(201).JSON(fiber.Map{
		"message": "User registered successfully",
		"user": fiber.Map{
			"id":         user.ID,
			"email":      user.Email,
			"first_name": user.FirstName,
			"last_name":  user.LastName,
		},
	})
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		log.Printf("Login: failed to parse body: %v", err)
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	log.Printf("Login attempt: email=%s", req.Email)

	var user models.User
	if err := h.db.Where("email = ?", req.Email).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			log.Printf("Login: user not found: %s", req.Email)
		} else {
			log.Printf("Login: db error: %v", err)
		}
		return c.Status(401).JSON(fiber.Map{"error": "Invalid credentials"})
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		log.Printf("Login: password mismatch for %s", req.Email)
		return c.Status(401).JSON(fiber.Map{"error": "Invalid credentials"})
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"email":   user.Email,
		"exp":     time.Now().Add(time.Hour * 72).Unix(),
	})

	tokenString, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
	if err != nil {
		log.Printf("Login: failed to sign token: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Could not generate token"})
	}

	log.Printf("Login successful: %s", user.Email)
	return c.JSON(fiber.Map{
		"access_token": tokenString,
		"user": fiber.Map{
			"id":         user.ID,
			"email":      user.Email,
			"first_name": user.FirstName,
			"last_name":  user.LastName,
		},
	})
}

// UpdateProfile обновляет имя, фамилию, email
type UpdateProfileRequest struct {
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Email     string `json:"email"`
}

func (h *AuthHandler) UpdateProfile(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uint)

	var req UpdateProfileRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	var user models.User
	if err := h.db.First(&user, userID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	// Проверяем, не занят ли новый email другим пользователем
	if req.Email != user.Email {
		var existing models.User
		if err := h.db.Where("email = ? AND id != ?", req.Email, userID).First(&existing).Error; err == nil {
			return c.Status(400).JSON(fiber.Map{"error": "Email already in use"})
		}
	}

	user.FirstName = req.FirstName
	user.LastName = req.LastName
	user.Email = req.Email

	if err := h.db.Save(&user).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update profile"})
	}

	return c.JSON(fiber.Map{
		"data": fiber.Map{
			"id":         user.ID,
			"email":      user.Email,
			"first_name": user.FirstName,
			"last_name":  user.LastName,
			"role":       user.Role,
		},
	})
}

// ChangePassword изменяет пароль
type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password"`
	NewPassword     string `json:"new_password"`
}

func (h *AuthHandler) ChangePassword(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uint)

	var req ChangePasswordRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	var user models.User
	if err := h.db.First(&user, userID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.CurrentPassword)); err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "Current password is incorrect"})
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to hash password"})
	}

	user.Password = string(hashedPassword)
	if err := h.db.Save(&user).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update password"})
	}

	return c.JSON(fiber.Map{"message": "Password changed successfully"})
}

// Me возвращает информацию о текущем пользователе
func (h *AuthHandler) Me(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uint)

	var user models.User
	if err := h.db.First(&user, userID).Error; err != nil {
		log.Printf("Me: user not found: id=%d", userID)
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	return c.JSON(fiber.Map{
		"data": fiber.Map{
			"id":         user.ID,
			"email":      user.Email,
			"first_name": user.FirstName,
			"last_name":  user.LastName,
			"role":       user.Role,
		},
	})
}
