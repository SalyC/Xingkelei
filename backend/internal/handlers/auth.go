package handlers

import (
	"fmt"
	"io"
	"math/rand"
	"os"
	"path/filepath"
	"time"

	"backend/internal/models"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/redis/go-redis/v9"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AuthHandler struct {
	db    *gorm.DB
	redis *redis.Client
}

func NewAuthHandler(db *gorm.DB, redis *redis.Client) *AuthHandler {
	return &AuthHandler{db: db, redis: redis}
}

// ── Регистрация ─────────────────────────────────────────
type RegisterRequest struct {
	Username  string `json:"username" validate:"required"`
	Password  string `json:"password" validate:"required,min=6"`
	FirstName string `json:"first_name" validate:"required"`
	LastName  string `json:"last_name" validate:"required"`
}

func (h *AuthHandler) Register(c *fiber.Ctx) error {
	var req RegisterRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Internal server error"})
	}

	code := fmt.Sprintf("%06d", rand.Intn(1000000))

	user := models.User{
		Username:         req.Username,
		Password:         string(hashedPassword),
		FirstName:        req.FirstName,
		LastName:         req.LastName,
		VerificationCode: code,
		IsVerified:       false,
	}

	if err := h.db.Create(&user).Error; err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Username already taken"})
	}

	botUsername := os.Getenv("TELEGRAM_BOT_USERNAME")
	if botUsername == "" {
		botUsername = "SinkeleiVerifyBot"
	}
	telegramLink := fmt.Sprintf("https://t.me/%s?start=%s", botUsername, code)

	return c.Status(201).JSON(fiber.Map{
		"message":       "To verify your account, open Telegram bot",
		"username":      user.Username,
		"telegram_link": telegramLink,
	})
}

// ── Подтверждение через Telegram ────────────────────────
type VerifyEmailRequest struct {
	Username string `json:"username"`
	Code     string `json:"code"`
}

func (h *AuthHandler) VerifyEmail(c *fiber.Ctx) error {
	var req VerifyEmailRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	var user models.User
	if err := h.db.Where("username = ?", req.Username).First(&user).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	if user.IsVerified {
		return c.Status(400).JSON(fiber.Map{"error": "Already verified"})
	}

	if user.VerificationCode != req.Code {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid code"})
	}

	user.IsVerified = true
	user.VerificationCode = ""
	h.db.Save(&user)

	return c.JSON(fiber.Map{"message": "Account verified successfully"})
}

// ── Повторная отправка кода ─────────────────────────────
type ResendVerificationRequest struct {
	Username string `json:"username"`
}

func (h *AuthHandler) ResendVerificationCode(c *fiber.Ctx) error {
	var req ResendVerificationRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	var user models.User
	if err := h.db.Where("username = ?", req.Username).First(&user).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	if user.IsVerified {
		return c.Status(400).JSON(fiber.Map{"error": "Already verified"})
	}

	code := fmt.Sprintf("%06d", rand.Intn(1000000))
	user.VerificationCode = code
	h.db.Save(&user)

	botUsername := os.Getenv("TELEGRAM_BOT_USERNAME")
	if botUsername == "" {
		botUsername = "SinkeleiVerifyBot"
	}
	telegramLink := fmt.Sprintf("https://t.me/%s?start=%s", botUsername, code)

	return c.JSON(fiber.Map{
		"message":       "New code generated. Open Telegram bot to get it",
		"telegram_link": telegramLink,
	})
}

// ── Логин ───────────────────────────────────────────────
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	var user models.User
	if err := h.db.Where("username = ?", req.Username).First(&user).Error; err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "Invalid credentials"})
	}

	if user.IsBlocked {
		return c.Status(403).JSON(fiber.Map{
			"error":     "Account is blocked",
			"banned":    true,
			"reason":    user.BanReason,
			"banned_at": user.BannedAt,
		})
	}

	if !user.IsVerified {
		return c.Status(403).JSON(fiber.Map{
			"error":    "Account not verified",
			"verified": false,
		})
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "Invalid credentials"})
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id":  user.ID,
		"username": user.Username,
		"exp":      time.Now().Add(time.Hour * 72).Unix(),
	})

	tokenString, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not generate token"})
	}

	return c.JSON(fiber.Map{
		"access_token": tokenString,
		"user": fiber.Map{
			"id":         user.ID,
			"username":   user.Username,
			"first_name": user.FirstName,
			"last_name":  user.LastName,
		},
	})
}

// ── Профиль ─────────────────────────────────────────────
func (h *AuthHandler) Me(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uint)

	var user models.User
	if err := h.db.First(&user, userID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	return c.JSON(fiber.Map{
		"data": fiber.Map{
			"id":         user.ID,
			"username":   user.Username,
			"first_name": user.FirstName,
			"last_name":  user.LastName,
			"role":       user.Role,
			"avatar_url": user.AvatarURL,
		},
	})
}

// ── Обновление профиля ───────────────────────────────────
type UpdateProfileRequest struct {
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Username  string `json:"username"`
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

	if req.Username != user.Username {
		var existing models.User
		if err := h.db.Where("username = ? AND id != ?", req.Username, userID).First(&existing).Error; err == nil {
			return c.Status(400).JSON(fiber.Map{"error": "Username already taken"})
		}
	}

	user.FirstName = req.FirstName
	user.LastName = req.LastName
	user.Username = req.Username

	if err := h.db.Save(&user).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update profile"})
	}

	return c.JSON(fiber.Map{
		"data": fiber.Map{
			"id":         user.ID,
			"username":   user.Username,
			"first_name": user.FirstName,
			"last_name":  user.LastName,
			"role":       user.Role,
			"avatar_url": user.AvatarURL,
		},
	})
}

// ── Смена пароля ─────────────────────────────────────────
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

// ── Загрузка аватара ─────────────────────────────────────
func (h *AuthHandler) UploadAvatar(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uint)

	file, err := c.FormFile("avatar")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "No file uploaded"})
	}

	if file.Size > 5*1024*1024 {
		return c.Status(400).JSON(fiber.Map{"error": "File too large (max 5MB)"})
	}

	ext := filepath.Ext(file.Filename)
	filename := fmt.Sprintf("avatar_%d_%d%s", userID, time.Now().Unix(), ext)

	savePath := filepath.Join("uploads", "avatars", filename)

	src, err := file.Open()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to open file"})
	}
	defer src.Close()

	dst, err := os.Create(savePath)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to create file"})
	}
	defer dst.Close()

	if _, err := io.Copy(dst, src); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to save file"})
	}

	baseURL := os.Getenv("BASE_URL")
	if baseURL == "" {
		baseURL = "http://localhost:8080"
	}
	avatarURL := fmt.Sprintf("%s/avatars/%s", baseURL, filename)

	var user models.User
	if err := h.db.First(&user, userID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}
	user.AvatarURL = avatarURL
	h.db.Save(&user)

	return c.JSON(fiber.Map{
		"avatar_url": avatarURL,
	})
}
